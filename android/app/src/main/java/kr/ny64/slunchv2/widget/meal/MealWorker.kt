package kr.ny64.slunchv2.widget.meal

import android.content.Context
import android.util.Log
import androidx.work.*
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class MealWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = suspendCoroutine { continuation ->
        Log.d("MealWorker", "Starting background sync")
        val repository = MealRepository(applicationContext)
        val calendar = java.util.Calendar.getInstance()
        val currentMonth = calendar.get(java.util.Calendar.MONTH)

        var successCount = 0
        var failCount = 0

        // Iterate until the end of the current month
        while (calendar.get(java.util.Calendar.MONTH) == currentMonth) {
            val success = repository.fetchAndCacheMealSync(calendar)
            if (success) {
                successCount++
            } else {
                failCount++
            }
            calendar.add(java.util.Calendar.DAY_OF_MONTH, 1)
        }

        Log.d("MealWorker", "Sync finished. Success: $successCount, Fail: $failCount")

        continuation.resume(Result.success())
    }
}
