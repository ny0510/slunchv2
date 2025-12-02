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
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.ArrayList
import java.util.Date
import java.util.Locale

class TimetableWidgetProvider : AppWidgetProvider() {

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
                        ComponentName(context, TimetableWidgetProvider::class.java)
                    )
                    onUpdate(context, appWidgetManager, appWidgetIds)
                }
            }

            ACTION_TIMETABLE_DATA_UPDATE -> {
                val timetableData = intent.getStringArrayListExtra(EXTRA_TIMETABLE_DATA) ?: arrayListOf()
                val displayDate = intent.getStringExtra(EXTRA_DISPLAY_DATE)
                    ?: SimpleDateFormat("M/d", Locale.KOREA).format(Date())
                val daysOffset = intent.getIntExtra(EXTRA_DAYS_OFFSET, 0)
                intent.getIntExtra(EXTRA_CURRENT_PERIOD, -1)
                updateWidgetWithTimetableResult(context, TimetableResult(timetableData, displayDate, daysOffset))
            }

            ACTION_TOGGLE_NEXT_WEEK -> {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val widgetId = intent.getIntExtra(
                    AppWidgetManager.EXTRA_APPWIDGET_ID,
                    AppWidgetManager.INVALID_APPWIDGET_ID
                )

                if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    // 현재 상태 토글
                    val prefs = context.getSharedPreferences(TIMETABLE_WIDGET_PREFS, Context.MODE_PRIVATE)
                    val currentNextWeek = prefs.getBoolean(KEY_NEXT_WEEK_PREFIX + widgetId, false)
                    prefs.edit().putBoolean(KEY_NEXT_WEEK_PREFIX + widgetId, !currentNextWeek).apply()
                    
                    // 위젯 업데이트
                    updateWeeklyWidget(context, appWidgetManager, widgetId)
                }
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
        // 위젯 크기 확인
        val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
        val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 110)
        val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110)
        
        // 3x4 이상 (너비 180dp, 높이 250dp 이상)이면 주간 시간표 모드
        val isWeeklyMode = minWidth >= 180 && minHeight >= 300

        if (isWeeklyMode) {
            updateWeeklyWidget(context, appWidgetManager, appWidgetId)
        } else {
            updateDailyWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateDailyWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_timetable_layout)

        applyTextSizes(context, appWidgetManager, appWidgetId, views)

        val currentDate = SimpleDateFormat("M/d", Locale.KOREA).format(Date())
        views.setTextViewText(R.id.widget_timetable_date, currentDate)
        views.setTextViewText(R.id.widget_timetable_empty, "오늘은 시간표가 없습니다.")

        val refreshPendingIntent = createRefreshPendingIntent(context, appWidgetId)
        configureTimetableListView(context, views, appWidgetId, refreshPendingIntent)
        setClickHandlers(context, views, appWidgetId, refreshPendingIntent)

        views.setViewVisibility(R.id.widget_timetable_loading, View.VISIBLE)
        views.setViewVisibility(R.id.widget_timetable_list, View.GONE)
        views.setViewVisibility(R.id.widget_timetable_empty, View.GONE)

        appWidgetManager.updateAppWidget(appWidgetId, views)

        fetchTimetableDataNatively(context)
    }

    private fun updateWeeklyWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_timetable_weekly_layout)

        // 다음주 토글 상태 확인
        val prefs = context.getSharedPreferences(TIMETABLE_WIDGET_PREFS, Context.MODE_PRIVATE)
        val isNextWeek = prefs.getBoolean(KEY_NEXT_WEEK_PREFIX + appWidgetId, false)

        views.setTextViewText(R.id.widget_timetable_date, "")
        views.setViewVisibility(R.id.widget_timetable_loading, View.VISIBLE)
        views.setViewVisibility(R.id.widget_timetable_table, View.GONE)
        views.setViewVisibility(R.id.widget_timetable_empty, View.GONE)

        // 토글 버튼 설정 (현재 보고 있는 주를 표시)
        val toggleText = if (isNextWeek) "다음주" else "이번주"
        views.setTextViewText(R.id.widget_next_week_toggle, toggleText)
        val toggleBg = if (isNextWeek) R.drawable.toggle_button_background_active else R.drawable.toggle_button_background
        views.setInt(R.id.widget_next_week_toggle, "setBackgroundResource", toggleBg)

        // 토글 버튼 클릭 핸들러
        val toggleIntent = Intent(context, TimetableWidgetProvider::class.java).apply {
            action = ACTION_TOGGLE_NEXT_WEEK
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        val togglePendingIntent = PendingIntent.getBroadcast(
            context,
            appWidgetId * 2000 + 2,
            toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_next_week_toggle, togglePendingIntent)

        val refreshPendingIntent = createRefreshPendingIntent(context, appWidgetId)
        views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent)
        
        val appIntent = Intent(context, MainActivity::class.java)
        val appPendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId * 2000 + 1,
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_timetable_title, appPendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)

        fetchWeeklyTimetableDataNatively(context, appWidgetId, isNextWeek)
    }

    private fun fetchTimetableDataNatively(context: Context) {
        val apiClient = TimetableApiClient(context)
        apiClient.fetchTimetable { timetableResult ->
            Handler(Looper.getMainLooper()).post {
                updateWidgetWithTimetableResult(context, timetableResult)
            }
        }
    }

    private fun fetchWeeklyTimetableDataNatively(context: Context, appWidgetId: Int, forceNextWeek: Boolean = false) {
        val apiClient = TimetableApiClient(context)
        apiClient.fetchWeeklyTimetable(forceNextWeek) { weeklyResult ->
            Handler(Looper.getMainLooper()).post {
                updateWidgetWithWeeklyResult(context, appWidgetId, weeklyResult, forceNextWeek)
            }
        }
    }

    private fun updateWidgetWithWeeklyResult(
        context: Context,
        appWidgetId: Int,
        weeklyResult: WeeklyTimetableResult?,
        forceNextWeek: Boolean = false
    ) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val views = RemoteViews(context.packageName, R.layout.widget_timetable_weekly_layout)

        // 토글 버튼 설정 (현재 보고 있는 주를 표시)
        val toggleText = if (forceNextWeek) "다음주" else "이번주"
        views.setTextViewText(R.id.widget_next_week_toggle, toggleText)
        val toggleBg = if (forceNextWeek) R.drawable.toggle_button_background_active else R.drawable.toggle_button_background
        views.setInt(R.id.widget_next_week_toggle, "setBackgroundResource", toggleBg)

        // 토글 버튼 클릭 핸들러
        val toggleIntent = Intent(context, TimetableWidgetProvider::class.java).apply {
            action = ACTION_TOGGLE_NEXT_WEEK
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        val togglePendingIntent = PendingIntent.getBroadcast(
            context,
            appWidgetId * 2000 + 2,
            toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_next_week_toggle, togglePendingIntent)

        val refreshPendingIntent = createRefreshPendingIntent(context, appWidgetId)
        views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent)

        val appIntent = Intent(context, MainActivity::class.java)
        val appPendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId * 2000 + 1,
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_timetable_title, appPendingIntent)

        views.setViewVisibility(R.id.widget_timetable_loading, View.GONE)

        if (weeklyResult == null) {
            views.setTextViewText(R.id.widget_timetable_date, "")
            views.setViewVisibility(R.id.widget_timetable_table, View.GONE)
            views.setViewVisibility(R.id.widget_timetable_empty, View.VISIBLE)
            appWidgetManager.updateAppWidget(appWidgetId, views)
            return
        }

        views.setTextViewText(R.id.widget_timetable_date, "${weeklyResult.weekStartDate}~${weeklyResult.weekEndDate}")

        views.setViewVisibility(R.id.widget_timetable_table, View.VISIBLE)
        views.setViewVisibility(R.id.widget_timetable_empty, View.GONE)

        // 기존 행들 제거
        views.removeAllViews(R.id.widget_timetable_rows)

        // 시간표 행 추가
        for (period in 0 until weeklyResult.maxPeriods) {
            val rowView = RemoteViews(context.packageName, R.layout.widget_timetable_row)
            rowView.setTextViewText(R.id.period_num, (period + 1).toString())

            // 월~금 과목 설정
            val subjectIds = listOf(
                R.id.subject_mon,
                R.id.subject_tue,
                R.id.subject_wed,
                R.id.subject_thu,
                R.id.subject_fri
            )

            for (dayIndex in 0 until 5) {
                val subjects = weeklyResult.weeklyData.getOrNull(dayIndex) ?: emptyList()
                val subject = subjects.getOrNull(period) ?: ""
                rowView.setTextViewText(subjectIds[dayIndex], subject)
            }

            views.addView(R.id.widget_timetable_rows, rowView)
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun updateWidgetWithTimetableResult(context: Context, timetableResult: TimetableResult) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, TimetableWidgetProvider::class.java)
        )

        if (appWidgetIds.isEmpty()) {
            return
        }

        saveTimetableData(context, appWidgetIds, timetableResult.timetableData)
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_timetable_list)

        // 날짜 표시: N일 뒤면 "(N일뒤) M/d" 형식으로 표시
        val dateText = if (timetableResult.daysOffset > 0) {
            "${timetableResult.displayDate} (${timetableResult.daysOffset}일뒤)"
        } else {
            timetableResult.displayDate
        }
        val isEmpty = timetableResult.timetableData.isEmpty()

        appWidgetIds.forEach { appWidgetId ->
            val views = RemoteViews(context.packageName, R.layout.widget_timetable_layout)

            applyTextSizes(context, appWidgetManager, appWidgetId, views)

            views.setTextViewText(R.id.widget_timetable_date, dateText)
            views.setTextViewText(R.id.widget_timetable_empty, "시간표 정보가 없습니다.")

            val refreshPendingIntent = createRefreshPendingIntent(context, appWidgetId)
            configureTimetableListView(context, views, appWidgetId, refreshPendingIntent)
            setClickHandlers(context, views, appWidgetId, refreshPendingIntent)

            views.setViewVisibility(R.id.widget_timetable_loading, View.GONE)
            views.setViewVisibility(R.id.widget_timetable_list, View.VISIBLE)
            views.setViewVisibility(
                R.id.widget_timetable_empty,
                if (isEmpty) View.VISIBLE else View.GONE
            )

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    private fun configureTimetableListView(
        context: Context,
        views: RemoteViews,
        appWidgetId: Int,
        refreshPendingIntent: PendingIntent
    ) {
        val adapterIntent = Intent(context, TimetableWidgetService::class.java).apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
        }
        views.setRemoteAdapter(R.id.widget_timetable_list, adapterIntent)
        views.setEmptyView(R.id.widget_timetable_list, R.id.widget_timetable_empty)
        views.setPendingIntentTemplate(R.id.widget_timetable_list, refreshPendingIntent)
    }

    private fun setClickHandlers(
        context: Context,
        views: RemoteViews,
        appWidgetId: Int,
        refreshPendingIntent: PendingIntent
    ) {
        views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent)
        views.setOnClickPendingIntent(R.id.widget_timetable_date, refreshPendingIntent)
        views.setOnClickPendingIntent(R.id.widget_timetable_empty, refreshPendingIntent)

        val appIntent = Intent(context, MainActivity::class.java)
        val appPendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId * 2000 + 1,
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_timetable_title, appPendingIntent)
    }

    private fun applyTextSizes(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        views: RemoteViews
    ) {
        val sizes = resolveTextSizes(appWidgetManager, appWidgetId)
        views.setTextViewTextSize(R.id.widget_timetable_title, TypedValue.COMPLEX_UNIT_SP, sizes.title)
        views.setTextViewTextSize(R.id.widget_timetable_date, TypedValue.COMPLEX_UNIT_SP, sizes.date)
        views.setTextViewTextSize(R.id.widget_timetable_empty, TypedValue.COMPLEX_UNIT_SP, sizes.content)
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
                minWidth >= 210 -> 14f
                minWidth >= 140 -> 13f
                else -> 12f
            }

            val dateSize = when {
                minWidth >= 210 -> 14f
                minWidth >= 140 -> 13f
                else -> 12f
            }

            TextSizes(titleSize, contentSize, dateSize)
        } catch (_: Exception) {
            TextSizes(16f, 13f, 12f)
        }
    }

    private fun saveContentTextSize(context: Context, appWidgetId: Int, sizeSp: Float) {
        val prefs = context.getSharedPreferences(TIMETABLE_WIDGET_PREFS, Context.MODE_PRIVATE)
        prefs.edit()
            .putFloat(KEY_TIMETABLE_CONTENT_SIZE_PREFIX + appWidgetId, sizeSp)
            .apply()
    }

    private fun saveTimetableData(
        context: Context,
        appWidgetIds: IntArray,
        timetableData: ArrayList<String>
    ) {
        val prefs = context.getSharedPreferences(TIMETABLE_WIDGET_PREFS, Context.MODE_PRIVATE)
        val payload = JSONArray().apply {
            timetableData.forEach { put(it) }
        }.toString()

        val editor = prefs.edit()
        appWidgetIds.forEach { editor.putString(KEY_TIMETABLE_DATA_PREFIX + it, payload) }
        editor.apply()
    }

    private fun clearStoredData(context: Context, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences(TIMETABLE_WIDGET_PREFS, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        appWidgetIds.forEach {
            editor.remove(KEY_TIMETABLE_DATA_PREFIX + it)
            editor.remove(KEY_TIMETABLE_CONTENT_SIZE_PREFIX + it)
        }
        editor.apply()
    }

    private fun createRefreshPendingIntent(context: Context, appWidgetId: Int): PendingIntent {
        val refreshIntent = Intent(context, TimetableWidgetProvider::class.java).apply {
            action = ACTION_WIDGET_UPDATE
            setPackage(context.packageName)
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        return PendingIntent.getBroadcast(
            context,
            appWidgetId * 2000,
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
        const val ACTION_WIDGET_UPDATE = "kr.ny64.slunchv2.TIMETABLE_WIDGET_UPDATE"
        const val ACTION_TIMETABLE_DATA_UPDATE = "kr.ny64.slunchv2.TIMETABLE_DATA_UPDATE"
        const val ACTION_TOGGLE_NEXT_WEEK = "kr.ny64.slunchv2.TOGGLE_NEXT_WEEK"
        const val EXTRA_TIMETABLE_DATA = "timetable_data"
        const val EXTRA_DISPLAY_DATE = "display_date"
        const val EXTRA_DAYS_OFFSET = "days_offset"
        const val EXTRA_CURRENT_PERIOD = "current_period"
        const val KEY_NEXT_WEEK_PREFIX = "next_week_"

        fun updateWidgets(context: Context, timetableResult: TimetableResult, currentPeriod: Int) {
            val intent = Intent(ACTION_TIMETABLE_DATA_UPDATE)
            intent.putStringArrayListExtra(EXTRA_TIMETABLE_DATA, timetableResult.timetableData)
            intent.putExtra(EXTRA_DISPLAY_DATE, timetableResult.displayDate)
            intent.putExtra(EXTRA_DAYS_OFFSET, timetableResult.daysOffset)
            intent.putExtra(EXTRA_CURRENT_PERIOD, currentPeriod)
            context.sendBroadcast(intent)
        }
    }
}