package kr.ny64.slunchv2.widget.timetable

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import okhttp3.*
import org.json.JSONArray
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.collections.ArrayList

data class TimetableResult(
    val timetableData: ArrayList<String>,
    val displayDate: String,
    val daysOffset: Int
)

data class WeeklyTimetableResult(
    val weeklyData: List<List<String>>,
    val maxPeriods: Int,
    val isNextWeek: Boolean,
    val weekStartDate: String,
    val weekEndDate: String
)

class TimetableRepository(private val context: Context) {
    private val client = OkHttpClient()
    private val prefs: SharedPreferences = context.getSharedPreferences("user_prefs", Context.MODE_PRIVATE)
    private val cachePrefs: SharedPreferences = context.getSharedPreferences("timetable_cache_prefs", Context.MODE_PRIVATE)

    fun fetchTimetable(isNextWeek: Boolean = false, forceRefresh: Boolean = false, callback: (TimetableResult) -> Unit) {
        val schoolCode = prefs.getString("comciganSchoolCode", null)
        val grade = prefs.getInt("grade", 0)
        val classNum = prefs.getInt("class", 0)

        if (schoolCode == null || grade == 0 || classNum == 0) {
            val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
            callback(TimetableResult(arrayListOf("학교 정보가 없습니다.\n앱에서 학교를 설정해주세요."), today, 0))
            return
        }

        // Try this week first, then next week if needed
        fetchTimetableIteratively(schoolCode, grade, classNum, if (isNextWeek) 7 else 0, false, forceRefresh, callback)
    }

    private fun fetchTimetableIteratively(
        schoolCode: String,
        grade: Int,
        classNum: Int,
        dayOffset: Int,
        isNextWeek: Boolean,
        forceRefresh: Boolean,
        callback: (TimetableResult) -> Unit
    ) {
        if (dayOffset > 7) {
            val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
            callback(TimetableResult(arrayListOf("시간표 정보가 없습니다."), today, 0))
            return
        }

        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_MONTH, dayOffset)
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
        val displayDate = SimpleDateFormat("M/d", Locale.KOREA).format(calendar.time)

        // Skip weekends
        if (dayOfWeek == Calendar.SATURDAY || dayOfWeek == Calendar.SUNDAY) {
            fetchTimetableIteratively(schoolCode, grade, classNum, dayOffset + 1, isNextWeek, forceRefresh, callback)
            return
        }

        val todayCalendar = Calendar.getInstance()
        val todayDayOfWeek = todayCalendar.get(Calendar.DAY_OF_WEEK)
        val daysUntilWeekend = when (todayDayOfWeek) {
            Calendar.MONDAY -> 4
            Calendar.TUESDAY -> 3
            Calendar.WEDNESDAY -> 2
            Calendar.THURSDAY -> 1
            Calendar.FRIDAY -> 0
            else -> -1
        }
        
        val targetIsNextWeek = if (isNextWeek) true else (dayOffset > daysUntilWeekend || todayDayOfWeek == Calendar.SATURDAY || todayDayOfWeek == Calendar.SUNDAY)
        val cacheKey = if (targetIsNextWeek) "weekly_next" else "weekly_current"

        // 1. Check Cache
        if (!forceRefresh) {
            val cachedWeekly = cachePrefs.getString(cacheKey, null)
            if (cachedWeekly != null) {
                val parsed = parseTimetableData(cachedWeekly, dayOfWeek)
                if (parsed != null) {
                    Log.d("TimetableRepo", "Using cache ($cacheKey) for $displayDate")
                    callback(TimetableResult(parsed, displayDate, dayOffset))
                    return
                }
            }
        }

        // 2. Network Fetch
        val baseUrl = "https://slunch-v2.ny64.kr"
        val url = "$baseUrl/comcigan/timetable?schoolCode=$schoolCode&grade=$grade&class=$classNum" + (if (targetIsNextWeek) "&nextweek=true" else "")
        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("TimetableRepo", "Network failed for $displayDate", e)
                // If network fails, try next day
                fetchTimetableIteratively(schoolCode, grade, classNum, dayOffset + 1, targetIsNextWeek, false, callback)
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (response.isSuccessful) {
                        val body = response.body?.string()
                        if (body != null) {
                            val todayStr = SimpleDateFormat("yyyyMMdd", Locale.KOREA).format(Date())
                            cachePrefs.edit()
                                .putString(cacheKey, body)
                                .putString("last_updated_$cacheKey", todayStr)
                                .apply()
                            
                            val parsed = parseTimetableData(body, dayOfWeek)
                            if (parsed != null) {
                                callback(TimetableResult(parsed, displayDate, dayOffset))
                                return
                            }
                        }
                    }
                    
                    Log.d("TimetableRepo", "No timetable for $displayDate (Code: ${response.code}), trying next day")
                    fetchTimetableIteratively(schoolCode, grade, classNum, dayOffset + 1, targetIsNextWeek, false, callback)
                }
            }
        })
    }

    fun fetchWeeklyTimetable(isNextWeek: Boolean, callback: (WeeklyTimetableResult?) -> Unit) {
        val schoolCode = prefs.getString("comciganSchoolCode", null)
        val grade = prefs.getInt("grade", 0)
        val classNum = prefs.getInt("class", 0)

        if (schoolCode == null || grade == 0 || classNum == 0) {
            callback(null)
            return
        }

        val cacheKey = if (isNextWeek) "weekly_next" else "weekly_current"
        val lastUpdatedKey = "last_updated_$cacheKey"
        val cachedData = cachePrefs.getString(cacheKey, null)
        val lastUpdated = cachePrefs.getString(lastUpdatedKey, "")
        val today = SimpleDateFormat("yyyyMMdd", Locale.KOREA).format(Date())

        if (cachedData != null && lastUpdated == today) {
            Log.d("TimetableRepo", "Using fresh cache for $cacheKey")
            callback(parseWeeklyTimetableData(cachedData, isNextWeek))
            return
        }

        val baseUrl = "https://slunch-v2.ny64.kr"
        val url = if (isNextWeek) {
            "$baseUrl/comcigan/timetable?schoolCode=$schoolCode&grade=$grade&class=$classNum&nextweek=true"
        } else {
            "$baseUrl/comcigan/timetable?schoolCode=$schoolCode&grade=$grade&class=$classNum"
        }

        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                if (cachedData != null) {
                    Log.d("TimetableRepo", "Weekly network failed, using cache")
                    callback(parseWeeklyTimetableData(cachedData, isNextWeek))
                } else {
                    callback(null)
                }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        if (cachedData != null) {
                            callback(parseWeeklyTimetableData(cachedData, isNextWeek))
                        } else {
                            callback(null)
                        }
                        return
                    }

                    try {
                        val body = response.body?.string()
                        if (body != null) {
                            val todayStr = SimpleDateFormat("yyyyMMdd", Locale.KOREA).format(Date())
                            cachePrefs.edit()
                                .putString(cacheKey, body)
                                .putString("last_updated_$cacheKey", todayStr)
                                .apply()
                            val result = parseWeeklyTimetableData(body, isNextWeek)
                            callback(result)
                        } else {
                            callback(null)
                        }
                    } catch (e: Exception) {
                        if (cachedData != null) {
                            callback(parseWeeklyTimetableData(cachedData, isNextWeek))
                        } else {
                            callback(null)
                        }
                    }
                }
            }
        })
    }

    // Synchronous fetch for WorkManager
    fun fetchAndCacheTimetableSync(isNextWeek: Boolean): Boolean {
        val schoolCode = prefs.getString("comciganSchoolCode", null) ?: return false
        val grade = prefs.getInt("grade", 0)
        val classNum = prefs.getInt("class", 0)
        if (grade == 0 || classNum == 0) return false

        val cacheKey = if (isNextWeek) "weekly_next" else "weekly_current"
        
        // Check if already cached? Maybe we want to refresh if on wifi.
        // But if we want to respect the "update whenever wifi connected" rule, we should fetch.
        
        val baseUrl = "https://slunch-v2.ny64.kr"
        val url = if (isNextWeek) {
            "$baseUrl/comcigan/timetable?schoolCode=$schoolCode&grade=$grade&class=$classNum&nextweek=true"
        } else {
            "$baseUrl/comcigan/timetable?schoolCode=$schoolCode&grade=$grade&class=$classNum"
        }

        val request = Request.Builder().url(url).build()
        val latch = CountDownLatch(1)
        var success = false

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                latch.countDown()
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (response.isSuccessful) {
                        val body = response.body?.string()
                        if (body != null) {
                            val todayStr = SimpleDateFormat("yyyyMMdd", Locale.KOREA).format(Date())
                            cachePrefs.edit()
                                .putString(cacheKey, body)
                                .putString("last_updated_$cacheKey", todayStr)
                                .apply()
                            success = true
                        }
                    }
                }
                latch.countDown()
            }
        })

        try {
            latch.await(10, TimeUnit.SECONDS)
        } catch (e: InterruptedException) {
            return false
        }

        return success
    }

    companion object {
        fun parseTimetableData(jsonString: String, dayOfWeek: Int): ArrayList<String>? {
            try {
                val jsonArray = JSONArray(jsonString)
                if (jsonArray.length() == 0) return null

                val dayIndex = when(dayOfWeek) {
                    Calendar.MONDAY -> 0
                    Calendar.TUESDAY -> 1
                    Calendar.WEDNESDAY -> 2
                    Calendar.THURSDAY -> 3
                    Calendar.FRIDAY -> 4
                    else -> return null
                }

                if (dayIndex >= jsonArray.length()) return null

                val dayData = jsonArray.getJSONArray(dayIndex)
                val timetableList = ArrayList<String>()

                for (i in 0 until dayData.length()) {
                    val period = dayData.getJSONObject(i)
                    val subject = period.getString("subject")
                    val teacher = period.getString("teacher")
                    val changed = period.optBoolean("changed", false)

                    if (subject.isNotBlank() && subject != "null") {
                        val displayText = if (changed) {
                            "$subject* ($teacher)"
                        } else {
                            "$subject ($teacher)"
                        }
                        timetableList.add(displayText)
                    }
                }

                return if (timetableList.isEmpty()) null else timetableList

            } catch (e: Exception) {
                return null
            }
        }

        fun parseWeeklyTimetableData(jsonString: String, isNextWeek: Boolean): WeeklyTimetableResult? {
            try {
                val jsonArray = JSONArray(jsonString)
                if (jsonArray.length() == 0) return null

                val weeklyData = mutableListOf<List<String>>()
                var maxPeriods = 0

                for (dayIndex in 0 until minOf(5, jsonArray.length())) {
                    val dayData = jsonArray.getJSONArray(dayIndex)
                    val daySubjects = mutableListOf<String>()

                    for (i in 0 until dayData.length()) {
                        val period = dayData.getJSONObject(i)
                        val subject = period.getString("subject")
                        val changed = period.optBoolean("changed", false)

                        if (subject.isNotBlank() && subject != "null") {
                            val displayText = if (changed) "$subject*" else subject
                            daySubjects.add(displayText)
                        }
                    }

                    weeklyData.add(daySubjects)
                    if (daySubjects.size > maxPeriods) {
                        maxPeriods = daySubjects.size
                    }
                }

                while (weeklyData.size < 5) {
                    weeklyData.add(emptyList())
                }

                if (maxPeriods == 0) return null

                val calendar = Calendar.getInstance()
                val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)

                // 1. 기본 오프셋 계산: 오늘이 주말(토/일)이면 기본적으로 다음 주(+7일)를 타겟팅
                var weekOffset = if (dayOfWeek == Calendar.SATURDAY || dayOfWeek == Calendar.SUNDAY) {
                    7
                } else {
                    0
                }

                // 2. 사용자가 '다음 주'를 요청(isNextWeek == true)했다면 추가로 +7일
                if (isNextWeek) {
                    weekOffset += 7
                }

                // 3. 계산된 weekOffset만큼 날짜 이동
                calendar.add(Calendar.DAY_OF_MONTH, weekOffset)

                // 4. 이동한 날짜가 속한 주의 '월요일'로 이동
                // (이미 타겟 주간에 들어와 있으므로 해당 주의 월요일만 찾으면 됨)
                val currentDayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
                val daysFromMonday = if (currentDayOfWeek == Calendar.SUNDAY) -6 else Calendar.MONDAY - currentDayOfWeek
                calendar.add(Calendar.DAY_OF_MONTH, daysFromMonday)

                // 5. 날짜 포맷팅 (월~금)
                val weekStartDate = SimpleDateFormat("M/d", Locale.KOREA).format(calendar.time)
                calendar.add(Calendar.DAY_OF_MONTH, 4)
                val weekEndDate = SimpleDateFormat("M/d", Locale.KOREA).format(calendar.time)

                return WeeklyTimetableResult(
                    weeklyData = weeklyData,
                    maxPeriods = maxPeriods,
                    isNextWeek = isNextWeek,
                    weekStartDate = weekStartDate,
                    weekEndDate = weekEndDate
                )

            } catch (e: Exception) {
                return null
            }
        }
    }
}
