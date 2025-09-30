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

    fun fetchTodayTimetable(callback: (ArrayList<String>) -> Unit) {
        // SharedPreferences에서 학교 정보 가져오기
        val schoolCode = prefs.getString("comciganSchoolCode", null)
        val grade = prefs.getInt("grade", 0)
        val classNum = prefs.getInt("class", 0)

        if (schoolCode == null || grade == 0 || classNum == 0) {
            callback(arrayListOf("학교 정보가 없습니다.\n앱에서 학교를 설정해주세요."))
            return
        }

        val calendar = Calendar.getInstance()
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)

        // 주말인 경우
        if (dayOfWeek == Calendar.SATURDAY || dayOfWeek == Calendar.SUNDAY) {
            callback(arrayListOf())
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
                callback(arrayListOf("시간표를 불러올 수 없습니다.\n네트워크를 확인해주세요."))
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        callback(arrayListOf("시간표를 불러올 수 없습니다.\n서버 오류 (${response.code})"))
                        return
                    }

                    try {
                        val body = response.body?.string()
                        if (body != null) {
                            val timetableData = parseTimetableData(body, dayOfWeek)
                            callback(timetableData)
                        } else {
                            callback(arrayListOf("시간표 정보가 없습니다."))
                        }
                    } catch (e: Exception) {
                        callback(arrayListOf("시간표 처리 중 오류가 발생했습니다."))
                    }
                }
            }
        })
    }

    private fun parseTimetableData(jsonString: String, dayOfWeek: Int): ArrayList<String> {
        try {
            val jsonArray = JSONArray(jsonString)
            if (jsonArray.length() == 0) {
                return arrayListOf()
            }

            // dayOfWeek: 1=일, 2=월, 3=화, 4=수, 5=목, 6=금, 7=토
            // API 배열 인덱스: 0=월, 1=화, 2=수, 3=목, 4=금
            val dayIndex = when(dayOfWeek) {
                Calendar.MONDAY -> 0
                Calendar.TUESDAY -> 1
                Calendar.WEDNESDAY -> 2
                Calendar.THURSDAY -> 3
                Calendar.FRIDAY -> 4
                else -> return arrayListOf()
            }

            if (dayIndex >= jsonArray.length()) {
                return arrayListOf()
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

            return timetableList

        } catch (e: Exception) {
            return arrayListOf("시간표 분석 중 오류가 발생했습니다.")
        }
    }

}