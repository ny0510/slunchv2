package kr.ny64.slunchv2.widget.meal

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

data class MealResult(
    val mealData: String,
    val displayDate: String,
    val daysOffset: Int
)

class MealRepository(private val context: Context) {
    private val client = OkHttpClient()
    private val prefs: SharedPreferences = context.getSharedPreferences("user_prefs", Context.MODE_PRIVATE)
    private val cachePrefs: SharedPreferences = context.getSharedPreferences("meal_cache_prefs", Context.MODE_PRIVATE)

    fun fetchMeal(forceRefresh: Boolean = false, callback: (MealResult) -> Unit) {
        val schoolCode = prefs.getString("schoolCode", null)
        val regionCode = prefs.getString("regionCode", null)

        if (schoolCode == null || regionCode == null) {
            val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
            callback(MealResult("학교 정보가 없습니다.\n앱에서 학교를 설정해주세요.", today, 0))
            return
        }

        val currentHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val startOffset = if (currentHour >= 14) 1 else 0

        // Try to find meal data for the next 7 days
        fetchMealIteratively(schoolCode, regionCode, startOffset, forceRefresh, callback)
    }

    private fun fetchMealIteratively(
        schoolCode: String,
        regionCode: String,
        offset: Int,
        forceRefresh: Boolean,
        callback: (MealResult) -> Unit
    ) {
        if (offset > 7) {
            val today = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
            callback(MealResult("급식 정보가 없습니다.", today, 0))
            return
        }

        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_MONTH, offset)
        
        val year = calendar.get(Calendar.YEAR).toString()
        val month = String.format("%02d", calendar.get(Calendar.MONTH) + 1)
        val day = String.format("%02d", calendar.get(Calendar.DAY_OF_MONTH))
        val dateKey = "$year$month$day"
        val displayDate = SimpleDateFormat("M/d", Locale.KOREA).format(calendar.time)

        // 1. Check Cache (unless forceRefresh is true for the first attempt)
        if (!forceRefresh) {
            val cachedMeal = cachePrefs.getString(dateKey, null)
            if (cachedMeal != null) {
                Log.d("MealRepository", "Using cache for $dateKey")
                callback(MealResult(cachedMeal, displayDate, offset))
                return
            }
        }

        // 2. Network Fetch
        val baseUrl = "https://slunch-v2.ny64.kr"
        val url = "$baseUrl/neis/meal?schoolCode=$schoolCode&regionCode=$regionCode&year=$year&month=$month&day=$day"
        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                // On network failure, we can't do much but try next day or fail
                Log.e("MealRepository", "Network failed for $dateKey", e)
                fetchMealIteratively(schoolCode, regionCode, offset + 1, false, callback)
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (response.isSuccessful) {
                        val body = response.body?.string()
                        val mealData = body?.let { parseMealData(it) }
                        if (mealData != null) {
                            cachePrefs.edit().putString(dateKey, mealData).apply()
                            callback(MealResult(mealData, displayDate, offset))
                            return
                        }
                    }
                    
                    // If not successful or no meal data, try next day
                    Log.d("MealRepository", "No meal for $dateKey (Code: ${response.code}), trying next day")
                    fetchMealIteratively(schoolCode, regionCode, offset + 1, false, callback)
                }
            }
        })
    }

    // Synchronous fetch for WorkManager
    fun fetchAndCacheMealSync(date: Calendar): Boolean {
        val schoolCode = prefs.getString("schoolCode", null) ?: return false
        val regionCode = prefs.getString("regionCode", null) ?: return false

        val year = date.get(Calendar.YEAR).toString()
        val month = String.format("%02d", date.get(Calendar.MONTH) + 1)
        val day = String.format("%02d", date.get(Calendar.DAY_OF_MONTH))
        val dateKey = "$year$month$day"

        val baseUrl = "https://slunch-v2.ny64.kr"
        val url = "$baseUrl/neis/meal?schoolCode=$schoolCode&regionCode=$regionCode&year=$year&month=$month&day=$day"
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
                            val mealData = parseMealData(body)
                            if (mealData != null) {
                                cachePrefs.edit().putString(dateKey, mealData).apply()
                                success = true
                            }
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
        fun parseMealData(jsonString: String): String? {
            try {
                val jsonArray = JSONArray(jsonString)
                if (jsonArray.length() == 0) return null

                val todayMeal = jsonArray.getJSONObject(0)
                val dishes = todayMeal.getJSONArray("meal")

                if (dishes.length() == 0) return null

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
}
