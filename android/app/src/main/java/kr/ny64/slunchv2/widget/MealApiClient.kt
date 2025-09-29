package kr.ny64.slunchv2.widget

import android.content.Context
import android.content.SharedPreferences
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class MealApiClient(private val context: Context) {
    private val client = OkHttpClient()
    private val prefs: SharedPreferences = context.getSharedPreferences("user_prefs", Context.MODE_PRIVATE)

    fun fetchTodayMeal(callback: (String) -> Unit) {
        // SharedPreferences에서 학교 정보 가져오기 (React Native 앱과 동일한 키 사용)
        val schoolCode = prefs.getString("schoolCode", null)
        val regionCode = prefs.getString("regionCode", null)

        if (schoolCode == null || regionCode == null) {
            callback("학교 정보가 없습니다.\n앱에서 학교를 설정해주세요.")
            return
        }

        val calendar = Calendar.getInstance()
        val year = calendar.get(Calendar.YEAR).toString()
        val month = String.format("%02d", calendar.get(Calendar.MONTH) + 1)
        val day = String.format("%02d", calendar.get(Calendar.DAY_OF_MONTH))

        // 커스텀 API 서버 호출 (React Native 앱과 동일한 API)
        val baseUrl = "https://slunch-v2.ny64.kr"
        val url = "$baseUrl/neis/meal?schoolCode=$schoolCode&regionCode=$regionCode&year=$year&month=$month&day=$day"


        val request = Request.Builder()
            .url(url)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback("급식 정보를 불러올 수 없습니다.\n네트워크를 확인해주세요.")
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        callback("급식 정보를 불러올 수 없습니다.\n서버 오류 (${response.code})")
                        return
                    }

                    try {
                        val body = response.body?.string()
                        if (body != null) {
                            val mealData = parseMealData(body)
                            callback(mealData)
                        } else {
                            callback("급식 정보가 없습니다.")
                        }
                    } catch (e: Exception) {
                        callback("급식 정보 처리 중 오류가 발생했습니다.")
                    }
                }
            }
        })
    }

    private fun parseMealData(jsonString: String): String {
        try {
            val jsonArray = JSONArray(jsonString)
            if (jsonArray.length() == 0) {
                return "오늘은 급식이 없습니다."
            }

            val todayMeal = jsonArray.getJSONObject(0)
            val dishes = todayMeal.getJSONArray("meal")

            if (dishes.length() == 0) {
                return "오늘은 급식이 없습니다."
            }

            val mealItems = mutableListOf<String>()
            for (i in 0 until dishes.length()) {
                val dish = dishes.getString(i)
                mealItems.add("• ${dish.trim()}")
            }

            return mealItems.joinToString("\n")

        } catch (e: Exception) {
            return "급식 정보 분석 중 오류가 발생했습니다."
        }
    }
}