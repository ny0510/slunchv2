package kr.ny64.slunchv2.widget.meal

import kr.ny64.slunchv2.widget.common.KEY_MEAL_CONTENT_SIZE_PREFIX
import kr.ny64.slunchv2.widget.common.KEY_MEAL_DATA_PREFIX
import kr.ny64.slunchv2.widget.common.MEAL_WIDGET_PREFS

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import kr.ny64.slunchv2.MainActivity
import kr.ny64.slunchv2.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MealWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_WIDGET_UPDATE = "kr.ny64.slunchv2.MEAL_WIDGET_UPDATE"
        const val ACTION_MEAL_DATA_UPDATE = "kr.ny64.slunchv2.MEAL_DATA_UPDATE"
        const val EXTRA_MEAL_DATA = "meal_data"
        const val EXTRA_DISPLAY_DATE = "display_date"
        const val EXTRA_DAYS_OFFSET = "days_offset"

        private var isFetching = false

        fun updateWidgets(context: Context, mealResult: MealResult) {
            val intent = Intent(ACTION_MEAL_DATA_UPDATE)
            intent.putExtra(EXTRA_MEAL_DATA, mealResult.mealData)
            intent.putExtra(EXTRA_DISPLAY_DATE, mealResult.displayDate)
            intent.putExtra(EXTRA_DAYS_OFFSET, mealResult.daysOffset)
            context.sendBroadcast(intent)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { updateAppWidget(context, appWidgetManager, it) }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_WIDGET_UPDATE -> {
                fetchMealDataNatively(context, forceRefresh = true)
            }

            ACTION_MEAL_DATA_UPDATE -> {
                val mealData = intent.getStringExtra(EXTRA_MEAL_DATA) ?: "급식 정보 없음"
                val displayDate = intent.getStringExtra(EXTRA_DISPLAY_DATE) 
                    ?: SimpleDateFormat("M/d", Locale.KOREA).format(Date())
                val daysOffset = intent.getIntExtra(EXTRA_DAYS_OFFSET, 0)
                updateWidgetWithMealResult(context, MealResult(mealData, displayDate, daysOffset))
            }
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)
        clearStoredData(context, appWidgetIds)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_meal_layout)
        applyTextSizes(context, appWidgetManager, appWidgetId, views)

        val refreshPendingIntent = createRefreshPendingIntent(context, appWidgetId)
        configureMealListView(context, views, appWidgetId, refreshPendingIntent)
        setClickHandlers(context, views, appWidgetId, refreshPendingIntent)

        // 1. Check Cache
        val cachePrefs = context.getSharedPreferences("meal_cache_prefs", Context.MODE_PRIVATE)
        val todayCalendar = java.util.Calendar.getInstance()
        val currentHour = todayCalendar.get(java.util.Calendar.HOUR_OF_DAY)
        val dayOffset = if (currentHour >= 14) 1 else 0
        
        val targetCalendar = java.util.Calendar.getInstance()
        targetCalendar.add(java.util.Calendar.DAY_OF_MONTH, dayOffset)
        
        val dateKey = "${targetCalendar.get(java.util.Calendar.YEAR)}${String.format("%02d", targetCalendar.get(java.util.Calendar.MONTH) + 1)}${String.format("%02d", targetCalendar.get(java.util.Calendar.DAY_OF_MONTH))}"
        
        val cachedMeal = cachePrefs.getString(dateKey, null)
        if (cachedMeal != null) {
            val displayDate = SimpleDateFormat("M/d", Locale.KOREA).format(targetCalendar.time)
            
            views.setTextViewText(R.id.widget_date, displayDate)
            if (dayOffset > 0) {
                views.setTextViewText(R.id.widget_days_offset_badge, "${dayOffset}일뒤")
                views.setViewVisibility(R.id.widget_days_offset_badge, View.VISIBLE)
            } else {
                views.setViewVisibility(R.id.widget_days_offset_badge, View.GONE)
            }
            
            views.setViewVisibility(R.id.widget_loading, View.GONE)
            views.setViewVisibility(R.id.widget_meal_list, View.VISIBLE)
            views.setViewVisibility(
                R.id.widget_meal_empty,
                if (cachedMeal.trim().isEmpty()) View.VISIBLE else View.GONE
            )
            
            saveMealData(context, intArrayOf(appWidgetId), cachedMeal)
            appWidgetManager.updateAppWidget(appWidgetId, views)
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_meal_list)
        } else {
            // 2. No Cache -> Show Empty State (No automatic fetch)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
            views.setViewVisibility(R.id.widget_meal_list, View.GONE)
            views.setViewVisibility(R.id.widget_meal_empty, View.VISIBLE)
            views.setTextViewText(R.id.widget_meal_empty, "급식 정보 없음\n(터치하여 새로고침)")
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    private fun fetchMealDataNatively(context: Context, forceRefresh: Boolean = false) {
        if (isFetching) return
        isFetching = true

        val repository = MealRepository(context)
        repository.fetchMeal(forceRefresh) { mealResult ->
            Handler(Looper.getMainLooper()).post {
                isFetching = false
                updateWidgetWithMealResult(context, mealResult)
            }
        }
    }

    private fun updateWidgetWithMealResult(context: Context, mealResult: MealResult) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, MealWidgetProvider::class.java)
        )

        if (appWidgetIds.isEmpty()) {
            return
        }

        saveMealData(context, appWidgetIds, mealResult.mealData)
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_meal_list)

        val trimmedMealData = mealResult.mealData.trim()

        appWidgetIds.forEach { appWidgetId ->
            val views = RemoteViews(context.packageName, R.layout.widget_meal_layout)

            applyTextSizes(context, appWidgetManager, appWidgetId, views)

            // 날짜 표시
            views.setTextViewText(R.id.widget_date, mealResult.displayDate)
            
            // N일뒤 벱지 표시
            if (mealResult.daysOffset > 0) {
                views.setTextViewText(R.id.widget_days_offset_badge, "${mealResult.daysOffset}일뒤")
                views.setViewVisibility(R.id.widget_days_offset_badge, View.VISIBLE)
            } else {
                views.setViewVisibility(R.id.widget_days_offset_badge, View.GONE)
            }
            
            views.setTextViewText(R.id.widget_meal_empty, "급식 정보 없음")

            val refreshPendingIntent = createRefreshPendingIntent(context, appWidgetId)
            configureMealListView(context, views, appWidgetId, refreshPendingIntent)
            setClickHandlers(context, views, appWidgetId, refreshPendingIntent)

            views.setViewVisibility(R.id.widget_loading, View.GONE)
            views.setViewVisibility(R.id.widget_meal_list, View.VISIBLE)
            views.setViewVisibility(
                R.id.widget_meal_empty,
                if (trimmedMealData.isEmpty()) View.VISIBLE else View.GONE
            )

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    private fun configureMealListView(
        context: Context,
        views: RemoteViews,
        appWidgetId: Int,
        refreshPendingIntent: PendingIntent
    ) {
        val adapterIntent = Intent(context, MealWidgetService::class.java).apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
        }
        views.setRemoteAdapter(R.id.widget_meal_list, adapterIntent)
        views.setEmptyView(R.id.widget_meal_list, R.id.widget_meal_empty)
        views.setPendingIntentTemplate(R.id.widget_meal_list, refreshPendingIntent)
    }

    private fun setClickHandlers(
        context: Context,
        views: RemoteViews,
        appWidgetId: Int,
        refreshPendingIntent: PendingIntent
    ) {
        views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent)
        views.setOnClickPendingIntent(R.id.widget_date, refreshPendingIntent)
        views.setOnClickPendingIntent(R.id.widget_meal_empty, refreshPendingIntent)

        val appIntent = Intent(context, MainActivity::class.java)
        val appPendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId * 1000 + 1,
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_title, appPendingIntent)
    }

    private fun applyTextSizes(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        views: RemoteViews
    ) {
        val sizes = resolveTextSizes(appWidgetManager, appWidgetId)
        views.setTextViewTextSize(R.id.widget_title, TypedValue.COMPLEX_UNIT_SP, sizes.title)
        views.setTextViewTextSize(R.id.widget_date, TypedValue.COMPLEX_UNIT_SP, sizes.date)
        views.setTextViewTextSize(R.id.widget_meal_empty, TypedValue.COMPLEX_UNIT_SP, sizes.content)
        saveContentTextSize(context, appWidgetId, sizes.content)
    }

    private fun resolveTextSizes(
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ): TextSizes {
        return try {
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 110)

            val titleSize = when {
                minWidth >= 210 -> 18f
                minWidth >= 140 -> 16f
                else -> 14f
            }

            val contentSize = when {
                minWidth >= 210 -> 15f
                minWidth >= 140 -> 14f
                else -> 13f
            }

            val dateSize = when {
                minWidth >= 210 -> 14f
                minWidth >= 140 -> 13f
                else -> 12f
            }

            TextSizes(titleSize, contentSize, dateSize)
        } catch (_: Exception) {
            TextSizes(16f, 14f, 13f)
        }
    }

    private fun saveContentTextSize(context: Context, appWidgetId: Int, sizeSp: Float) {
        val prefs = context.getSharedPreferences(MEAL_WIDGET_PREFS, Context.MODE_PRIVATE)
        prefs.edit()
            .putFloat(KEY_MEAL_CONTENT_SIZE_PREFIX + appWidgetId, sizeSp)
            .apply()
    }

    private fun saveMealData(context: Context, appWidgetIds: IntArray, mealData: String) {
        val prefs = context.getSharedPreferences(MEAL_WIDGET_PREFS, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        appWidgetIds.forEach { editor.putString(KEY_MEAL_DATA_PREFIX + it, mealData) }
        editor.apply()
    }

    private fun clearStoredData(context: Context, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences(MEAL_WIDGET_PREFS, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        appWidgetIds.forEach {
            editor.remove(KEY_MEAL_DATA_PREFIX + it)
            editor.remove(KEY_MEAL_CONTENT_SIZE_PREFIX + it)
        }
        editor.apply()
    }

    private fun createRefreshPendingIntent(context: Context, appWidgetId: Int): PendingIntent {
        val refreshIntent = Intent(context, MealWidgetProvider::class.java).apply {
            action = ACTION_WIDGET_UPDATE
            setPackage(context.packageName)
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        return PendingIntent.getBroadcast(
            context,
            appWidgetId * 1000,
            refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private data class TextSizes(
        val title: Float,
        val content: Float,
        val date: Float
    )
}