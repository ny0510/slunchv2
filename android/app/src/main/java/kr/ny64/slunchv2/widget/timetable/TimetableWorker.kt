package kr.ny64.slunchv2.widget.timetable

import android.content.Context
import android.util.Log
import androidx.work.*
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class TimetableWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = suspendCoroutine { continuation ->
        Log.d("TimetableWorker", "Starting background sync")
        val repository = TimetableRepository(applicationContext)
        
        // Cache this week
        val successCurrent = repository.fetchAndCacheTimetableSync(isNextWeek = false)
        
        // Cache next week
        val successNext = repository.fetchAndCacheTimetableSync(isNextWeek = true)

        Log.d("TimetableWorker", "Sync finished. Current: $successCurrent, Next: $successNext")
        
        continuation.resume(if (successCurrent || successNext) Result.success() else Result.retry())
    }
}
