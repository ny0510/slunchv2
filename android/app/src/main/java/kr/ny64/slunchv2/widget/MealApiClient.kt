package kr.ny64.slunchv2.widget

import android.content.Context
import android.content.SharedPreferences
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

data class MealResult(
    val mealData: String,
    val displayDate: String,  // "M/d" 형식
    val daysOffset: Int       // 0 = 오늘, 1 = 1일 뒤, ...
)

class MealApiClient(private val context: Context) {
    private val client = OkHttpClient()
    private val prefs: SharedPreferences = context.getSharedPreferences("user_prefs", Context.MODE_PRIVATE)

    fun fetchMeal(callback: (MealResult) -> Unit) {
        val schoolCode = prefs.getString("schoolCode", null)
        val regionCode = prefs.getString("regionCode", null)

        if (schoolCode == null || regionCode == null) {
            val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
            callback(MealResult("학교 정보가 없습니다.\n앱에서 학교를 설정해주세요.", today, 0))
            return
        }

        // 오늘부터 최대 3일 뒤까지 시도
        fetchMealWithOffset(schoolCode, regionCode, 0, callback)
    }

    private fun fetchMealWithOffset(
        schoolCode: String,
        regionCode: String,
        dayOffset: Int,
        callback: (MealResult) -> Unit
    ) {
        // 최대 3일 뒤까지만 시도
        if (dayOffset > 3) {
            val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
            callback(MealResult("급식 정보가 없습니다.", today, 0))
            return
        }

        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_MONTH, dayOffset)
        
        val year = calendar.get(Calendar.YEAR).toString()
        val month = String.format("%02d", calendar.get(Calendar.MONTH) + 1)
        val day = String.format("%02d", calendar.get(Calendar.DAY_OF_MONTH))
        val displayDate = SimpleDateFormat("M/d", Locale.KOREA).format(calendar.time)

        val baseUrl = "https://slunch-v2.ny64.kr"
        val url = "$baseUrl/neis/meal?schoolCode=$schoolCode&regionCode=$regionCode&year=$year&month=$month&day=$day"

        val request = Request.Builder()
            .url(url)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
                callback(MealResult("급식 정보를 불러올 수 없습니다.\n네트워크를 확인해주세요.", today, 0))
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
                        callback(MealResult("급식 정보를 불러올 수 없습니다.\n서버 오류 (${response.code})", today, 0))
                        return
                    }

                    try {
                        val body = response.body?.string()
                        if (body != null) {
                            val mealData = parseMealData(body)
                            if (mealData != null) {
                                // 급식 데이터가 있으면 반환
                                callback(MealResult(mealData, displayDate, dayOffset))
                            } else {
                                // 급식이 없으면 다음 날 시도
                                fetchMealWithOffset(schoolCode, regionCode, dayOffset + 1, callback)
                            }
                        } else {
                            // 응답 body가 없으면 다음 날 시도
                            fetchMealWithOffset(schoolCode, regionCode, dayOffset + 1, callback)
                        }
                    } catch (e: Exception) {
                        val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
                        callback(MealResult("급식 정보 처리 중 오류가 발생했습니다.", today, 0))
                    }
                }
            }
        })
    }

    // 급식이 있으면 문자열 반환, 없으면 null 반환
    private fun parseMealData(jsonString: String): String? {
        try {
            val jsonArray = JSONArray(jsonString)
            if (jsonArray.length() == 0) {
                return null
            }

            val todayMeal = jsonArray.getJSONObject(0)
            val dishes = todayMeal.getJSONArray("meal")

            if (dishes.length() == 0) {
                return null
            }

            val mealItems = mutableListOf<String>()
            for (i in 0 until dishes.length()) {
                val dish = dishes.getString(i)
                mealItems.add("• ${dish.trim()}")
            }

            return mealItems.joinToString("\n")

        } catch (e: Exception) {
            return null
        }
    }
}