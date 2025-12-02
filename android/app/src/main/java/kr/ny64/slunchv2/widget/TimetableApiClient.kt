package kr.ny64.slunchv2.widget

import android.content.Context
import android.content.SharedPreferences
import okhttp3.*
import org.json.JSONArray
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*
import kotlin.collections.ArrayList

data class TimetableResult(
    val timetableData: ArrayList<String>,
    val displayDate: String,  // "M/d" 형식
    val daysOffset: Int       // 0 = 오늘, 1 = 1일 뒤, ...
)

class TimetableApiClient(private val context: Context) {
    private val client = OkHttpClient()
    private val prefs: SharedPreferences = context.getSharedPreferences("user_prefs", Context.MODE_PRIVATE)

    fun fetchTimetable(callback: (TimetableResult) -> Unit) {
        val schoolCode = prefs.getString("comciganSchoolCode", null)
        val grade = prefs.getInt("grade", 0)
        val classNum = prefs.getInt("class", 0)

        if (schoolCode == null || grade == 0 || classNum == 0) {
            val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
            callback(TimetableResult(arrayListOf("학교 정보가 없습니다.\n앱에서 학교를 설정해주세요."), today, 0))
            return
        }

        // 오늘부터 최대 7일 뒤까지 시도 (이번 주 + 다음 주)
        fetchTimetableWithOffset(schoolCode, grade, classNum, 0, false, callback)
    }

    private fun fetchTimetableWithOffset(
        schoolCode: String,
        grade: Int,
        classNum: Int,
        dayOffset: Int,
        isNextWeek: Boolean,
        callback: (TimetableResult) -> Unit
    ) {
        // 최대 7일 뒤까지만 시도
        if (dayOffset > 7) {
            val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
            callback(TimetableResult(arrayListOf(), today, 0))
            return
        }

        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_MONTH, dayOffset)
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
        val displayDate = SimpleDateFormat("M/d", Locale.KOREA).format(calendar.time)

        // 주말인 경우 다음 날로 넘어감
        if (dayOfWeek == Calendar.SATURDAY || dayOfWeek == Calendar.SUNDAY) {
            fetchTimetableWithOffset(schoolCode, grade, classNum, dayOffset + 1, isNextWeek, callback)
            return
        }

        // 다음 주인지 확인 (오늘 기준으로 다음 주 월요일 이후인지)
        val todayCalendar = Calendar.getInstance()
        val todayDayOfWeek = todayCalendar.get(Calendar.DAY_OF_WEEK)
        
        // 이번 주의 남은 평일 수 계산
        val daysUntilWeekend = when (todayDayOfWeek) {
            Calendar.MONDAY -> 4
            Calendar.TUESDAY -> 3
            Calendar.WEDNESDAY -> 2
            Calendar.THURSDAY -> 1
            Calendar.FRIDAY -> 0
            else -> -1 // 주말
        }
        
        // dayOffset이 이번 주를 넘어가면 다음 주 API 호출
        val useNextWeek = if (todayDayOfWeek == Calendar.SATURDAY || todayDayOfWeek == Calendar.SUNDAY) {
            true // 오늘이 주말이면 무조건 다음 주
        } else {
            dayOffset > daysUntilWeekend
        }

        val baseUrl = "https://slunch-v2.ny64.kr"
        val url = if (useNextWeek) {
            "$baseUrl/comcigan/timetable?schoolCode=$schoolCode&grade=$grade&class=$classNum&nextweek=1"
        } else {
            "$baseUrl/comcigan/timetable?schoolCode=$schoolCode&grade=$grade&class=$classNum"
        }

        val request = Request.Builder()
            .url(url)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
                callback(TimetableResult(arrayListOf("시간표를 불러올 수 없습니다.\n네트워크를 확인해주세요."), today, 0))
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
                        callback(TimetableResult(arrayListOf("시간표를 불러올 수 없습니다.\n서버 오류 (${response.code})"), today, 0))
                        return
                    }

                    try {
                        val body = response.body?.string()
                        if (body != null) {
                            val timetableData = parseTimetableData(body, dayOfWeek)
                            if (timetableData != null && timetableData.isNotEmpty()) {
                                // 시간표 데이터가 있으면 반환
                                callback(TimetableResult(timetableData, displayDate, dayOffset))
                            } else {
                                // 시간표가 없으면 다음 날 시도
                                fetchTimetableWithOffset(schoolCode, grade, classNum, dayOffset + 1, useNextWeek, callback)
                            }
                        } else {
                            // 응답 body가 없으면 다음 날 시도
                            fetchTimetableWithOffset(schoolCode, grade, classNum, dayOffset + 1, useNextWeek, callback)
                        }
                    } catch (e: Exception) {
                        val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
                        callback(TimetableResult(arrayListOf("시간표 처리 중 오류가 발생했습니다."), today, 0))
                    }
                }
            }
        })
    }

    // 시간표가 있으면 ArrayList 반환, 없으면 null 반환
    private fun parseTimetableData(jsonString: String, dayOfWeek: Int): ArrayList<String>? {
        try {
            val jsonArray = JSONArray(jsonString)
            if (jsonArray.length() == 0) {
                return null
            }

            // dayOfWeek: 1=일, 2=월, 3=화, 4=수, 5=목, 6=금, 7=토
            // API 배열 인덱스: 0=월, 1=화, 2=수, 3=목, 4=금
            val dayIndex = when(dayOfWeek) {
                Calendar.MONDAY -> 0
                Calendar.TUESDAY -> 1
                Calendar.WEDNESDAY -> 2
                Calendar.THURSDAY -> 3
                Calendar.FRIDAY -> 4
                else -> return null
            }

            if (dayIndex >= jsonArray.length()) {
                return null
            }

            val dayData = jsonArray.getJSONArray(dayIndex)
            val timetableList = ArrayList<String>()

            for (i in 0 until dayData.length()) {
                val period = dayData.getJSONObject(i)
                val subject = period.getString("subject")
                val teacher = period.getString("teacher")
                val changed = period.optBoolean("changed", false)

                // 과목이 비어있지 않은 경우만 추가
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
}