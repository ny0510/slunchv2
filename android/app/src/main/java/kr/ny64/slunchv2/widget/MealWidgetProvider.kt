package kr.ny64.slunchv2.widget

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
import kr.ny64.slunchv2.MainActivity
import kr.ny64.slunchv2.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MealWidgetProvider : AppWidgetProvider() {

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
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val widgetId = intent.getIntExtra(
                    AppWidgetManager.EXTRA_APPWIDGET_ID,
                    AppWidgetManager.INVALID_APPWIDGET_ID
                )

                if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    updateAppWidget(context, appWidgetManager, widgetId)
                } else {
                    val appWidgetIds = appWidgetManager.getAppWidgetIds(
                        ComponentName(context, MealWidgetProvider::class.java)
                    )
                    onUpdate(context, appWidgetManager, appWidgetIds)
                }
            }

            ACTION_MEAL_DATA_UPDATE -> {
                val mealData = intent.getStringExtra(EXTRA_MEAL_DATA) ?: "급식 정보 없음"
                updateWidgetWithMealData(context, mealData)
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

        val currentDate = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
        views.setTextViewText(R.id.widget_date, currentDate)
        views.setTextViewText(R.id.widget_meal_empty, "급식 정보 없음")

        val refreshPendingIntent = createRefreshPendingIntent(context, appWidgetId)
        configureMealListView(context, views, appWidgetId, refreshPendingIntent)
        setClickHandlers(context, views, appWidgetId, refreshPendingIntent)

        views.setViewVisibility(R.id.widget_loading, View.VISIBLE)
        views.setViewVisibility(R.id.widget_meal_list, View.GONE)
        views.setViewVisibility(R.id.widget_meal_empty, View.GONE)

        appWidgetManager.updateAppWidget(appWidgetId, views)

        fetchMealDataNatively(context)
    }

    private fun fetchMealDataNatively(context: Context) {
        val apiClient = MealApiClient(context)
        apiClient.fetchTodayMeal { mealData ->
            Handler(Looper.getMainLooper()).post {
                updateWidgetWithMealData(context, mealData)
            }
        }
    }

    private fun updateWidgetWithMealData(context: Context, mealData: String) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, MealWidgetProvider::class.java)
        )

        if (appWidgetIds.isEmpty()) {
            return
        }

        saveMealData(context, appWidgetIds, mealData)
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_meal_list)

        val trimmedMealData = mealData.trim()
        val currentDate = SimpleDateFormat("M/d", Locale.KOREA).format(Date())

        appWidgetIds.forEach { appWidgetId ->
            val views = RemoteViews(context.packageName, R.layout.widget_meal_layout)

            applyTextSizes(context, appWidgetManager, appWidgetId, views)

            views.setTextViewText(R.id.widget_date, currentDate)
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

    companion object {
        const val ACTION_WIDGET_UPDATE = "kr.ny64.slunchv2.WIDGET_UPDATE"
        const val ACTION_MEAL_DATA_UPDATE = "kr.ny64.slunchv2.MEAL_DATA_UPDATE"
        const val EXTRA_MEAL_DATA = "meal_data"

        fun updateWidgets(context: Context, mealData: String) {
            val intent = Intent(ACTION_MEAL_DATA_UPDATE)
            intent.putExtra(EXTRA_MEAL_DATA, mealData)
            context.sendBroadcast(intent)
        }
    }
}