package kr.ny64.slunchv2.widget

import android.content.Context
import android.content.SharedPreferences
import okhttp3.*
import org.json.JSONArray
import java.io.IOException
import java.util.*
import kotlin.collections.ArrayList

class TimetableApiClient(private val context: Context) {
    private val client = OkHttpClient()
    private val prefs: SharedPreferences = context.getSharedPreferences("user_prefs", Context.MODE_PRIVATE)

    fun fetchTodayTimetable(callback: (ArrayList<String>, Int) -> Unit) {
        // SharedPreferences에서 학교 정보 가져오기
        val schoolCode = prefs.getString("comciganSchoolCode", null)
        val grade = prefs.getInt("grade", 0)
        val classNum = prefs.getInt("class", 0)

        if (schoolCode == null || grade == 0 || classNum == 0) {
            callback(arrayListOf("학교 정보가 없습니다.\n앱에서 학교를 설정해주세요."), -1)
            return
        }

        val calendar = Calendar.getInstance()
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)

        // 주말인 경우
        if (dayOfWeek == Calendar.SATURDAY || dayOfWeek == Calendar.SUNDAY) {
            callback(arrayListOf(), -1)
            return
        }

        // 커스텀 API 서버 호출
        val baseUrl = "https://slunch-v2.ny64.kr"
        val url = "$baseUrl/comcigan/timetable?schoolCode=$schoolCode&grade=$grade&class=$classNum"

        val request = Request.Builder()
            .url(url)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(arrayListOf("시간표를 불러올 수 없습니다.\n네트워크를 확인해주세요."), -1)
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        callback(arrayListOf("시간표를 불러올 수 없습니다.\n서버 오류 (${response.code})"), -1)
                        return
                    }

                    try {
                        val body = response.body?.string()
                        if (body != null) {
                            val (timetableData, currentPeriod) = parseTimetableData(body, dayOfWeek)
                            callback(timetableData, currentPeriod)
                        } else {
                            callback(arrayListOf("시간표 정보가 없습니다."), -1)
                        }
                    } catch (e: Exception) {
                        callback(arrayListOf("시간표 처리 중 오류가 발생했습니다."), -1)
                    }
                }
            }
        })
    }

    private fun parseTimetableData(jsonString: String, dayOfWeek: Int): Pair<ArrayList<String>, Int> {
        try {
            val jsonArray = JSONArray(jsonString)
            if (jsonArray.length() == 0) {
                return Pair(arrayListOf(), -1)
            }

            // dayOfWeek: 1=일, 2=월, 3=화, 4=수, 5=목, 6=금, 7=토
            // API 배열 인덱스: 0=월, 1=화, 2=수, 3=목, 4=금
            val dayIndex = when(dayOfWeek) {
                Calendar.MONDAY -> 0
                Calendar.TUESDAY -> 1
                Calendar.WEDNESDAY -> 2
                Calendar.THURSDAY -> 3
                Calendar.FRIDAY -> 4
                else -> return Pair(arrayListOf(), -1)
            }

            if (dayIndex >= jsonArray.length()) {
                return Pair(arrayListOf(), -1)
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

            // 현재 교시 계산
            val currentPeriod = calculateCurrentPeriod()

            return Pair(timetableList, currentPeriod)

        } catch (e: Exception) {
            return Pair(arrayListOf("시간표 분석 중 오류가 발생했습니다."), -1)
        }
    }

    private fun calculateCurrentPeriod(): Int {
        val calendar = Calendar.getInstance()
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val minute = calendar.get(Calendar.MINUTE)
        val currentTimeMinutes = hour * 60 + minute

        // 시간을 분 단위로 변환하는 헬퍼 함수
        fun timeToMinutes(hour: Int, minute: Int) = hour * 60 + minute

        // 고등학교 시간표 (50분 수업 + 10분 쉬는시간)
        data class Period(val startTime: Int, val endTime: Int)

        // 8:30 시작, 각 교시는 50분 수업 + 10분 휴식
        val firstPeriodStart = timeToMinutes(8, 30)
        val classDuration = 50  // 수업 시간 (분)
        val breakDuration = 10  // 쉬는 시간 (분)
        val lunchBreakStart = 4 // 4교시 후 점심시간
        val lunchDuration = 60  // 점심시간 (분)

        val periods = mutableListOf<Period>()
        var currentStart = firstPeriodStart

        for (i in 1..7) {
            // 점심시간 고려
            if (i == lunchBreakStart + 1) {
                currentStart += lunchDuration
            }

            val endTime = currentStart + classDuration - 1
            periods.add(Period(currentStart, endTime))
            currentStart = endTime + 1 + breakDuration
        }

        // 현재 시간이 몇 교시인지 확인
        for (i in periods.indices) {
            val period = periods[i]
            if (currentTimeMinutes in period.startTime..period.endTime) {
                return i + 1 // 교시는 1부터 시작
            }
        }

        // 수업 시간이 아닌 경우
        return when {
            currentTimeMinutes < periods.first().startTime -> 0  // 수업 시작 전
            else -> -1  // 모든 수업 종료
        }
    }
}