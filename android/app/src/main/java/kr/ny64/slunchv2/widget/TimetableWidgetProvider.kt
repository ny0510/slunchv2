package kr.ny64.slunchv2.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.TypedValue
import android.widget.RemoteViews
import kr.ny64.slunchv2.MainActivity
import kr.ny64.slunchv2.R
import java.text.SimpleDateFormat
import java.util.*

class TimetableWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
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
                    // 특정 위젯만 업데이트
                    updateAppWidget(context, appWidgetManager, widgetId)
                } else {
                    // 모든 위젯 업데이트
                    val appWidgetIds = appWidgetManager.getAppWidgetIds(
                        ComponentName(context, TimetableWidgetProvider::class.java)
                    )
                    onUpdate(context, appWidgetManager, appWidgetIds)
                }
            }
            ACTION_TIMETABLE_DATA_UPDATE -> {
                val timetableData = intent.getStringArrayListExtra(EXTRA_TIMETABLE_DATA) ?: arrayListOf()
                val currentPeriod = intent.getIntExtra(EXTRA_CURRENT_PERIOD, -1)
                updateWidgetWithTimetableData(context, timetableData, currentPeriod)
            }
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_timetable_layout)

        // 위젯 크기에 따른 텍스트 크기 조정
        adjustTextSizeForWidget(views, appWidgetManager, appWidgetId)

        // 현재 날짜
        val calendar = Calendar.getInstance()
        val dateFormat = SimpleDateFormat("M/d", Locale.KOREA)
        val currentDate = dateFormat.format(Date())

        views.setTextViewText(R.id.widget_timetable_date, "$currentDate")

        // 클릭 시 위젯 새로고침 - 고유한 request code와 명시적 패키지 설정
        val refreshIntent = Intent(context, TimetableWidgetProvider::class.java).apply {
            action = ACTION_WIDGET_UPDATE
            setPackage(context.packageName)
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        val refreshPendingIntent = PendingIntent.getBroadcast(
            context,
            appWidgetId * 2000, // 고유한 request code 사용 (급식 위젯과 겹치지 않도록 2000 사용)
            refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 전체 위젯 영역에 클릭 리스너 설정
        views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent)
        views.setOnClickPendingIntent(R.id.widget_timetable_content, refreshPendingIntent)
        views.setOnClickPendingIntent(R.id.widget_timetable_date, refreshPendingIntent)

        // 제목 클릭 시 앱 열기
        val appIntent = Intent(context, MainActivity::class.java)
        val appPendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId * 2000 + 1, // 고유한 request code
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_timetable_title, appPendingIntent)

        // 로딩 상태 표시
        views.setTextViewText(R.id.widget_timetable_content, "")
        views.setViewVisibility(R.id.widget_timetable_loading, android.view.View.VISIBLE)
        appWidgetManager.updateAppWidget(appWidgetId, views)

        // 네이티브에서 직접 시간표 데이터 가져오기
        fetchTimetableDataNatively(context)
    }

    private fun fetchTimetableDataNatively(context: Context) {
        val apiClient = TimetableApiClient(context)
        apiClient.fetchTodayTimetable { timetableData, currentPeriod ->
            // UI 스레드에서 위젯 업데이트
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                updateWidgetWithTimetableData(context, timetableData, currentPeriod)
            }
        }
    }

    private fun updateWidgetWithTimetableData(context: Context, timetableData: ArrayList<String>, currentPeriod: Int) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, TimetableWidgetProvider::class.java)
        )

        // 다크모드 확인
        val isDarkMode = (context.resources.configuration.uiMode and
            android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_timetable_layout)

            // 위젯 크기 가져오기
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 110)

            // 크기에 따른 텍스트 크기 조정
            adjustTextSizeForWidget(views, appWidgetManager, appWidgetId)

            // 로딩 스피너 숨기기
            views.setViewVisibility(R.id.widget_timetable_loading, android.view.View.GONE)

            // 시간표 데이터 표시
            if (timetableData.isEmpty()) {
                views.setTextViewText(R.id.widget_timetable_content, "오늘은 시간표가 없습니다.")
            } else {
                // 위젯 크기에 따라 다른 레이아웃 사용
                val displayText = if (minWidth >= 280) { // 4칸 이상
                    buildWideDisplay(timetableData, currentPeriod, isDarkMode)
                } else {
                    buildTimetableDisplay(timetableData, currentPeriod, isDarkMode)
                }
                views.setTextViewText(R.id.widget_timetable_content, displayText)
            }

            // 현재 날짜
            val calendar = Calendar.getInstance()
            val dateFormat = SimpleDateFormat("M/d", Locale.KOREA)
            val currentDate = dateFormat.format(Date())

            views.setTextViewText(R.id.widget_timetable_date, "$currentDate")

            // 클릭 리스너 재설정 (데이터 업데이트 시에도 클릭 이벤트 유지)
            val refreshIntent = Intent(context, TimetableWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_UPDATE
                setPackage(context.packageName)
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            val refreshPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId * 2000,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // 전체 위젯 영역에 클릭 리스너 설정
            views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_timetable_content, refreshPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_timetable_date, refreshPendingIntent)

            // 제목 클릭 시 앱 열기
            val appIntent = Intent(context, MainActivity::class.java)
            val appPendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId * 2000 + 1,
                appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_timetable_title, appPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    private fun buildTimetableDisplay(timetableData: ArrayList<String>, currentPeriod: Int, isDarkMode: Boolean = false): CharSequence {
        val builder = StringBuilder()

        for (i in timetableData.indices) {
            val periodNum = i + 1
            val subject = timetableData[i]

            // 과목명만 추출 (선생님 이름 제거)
            val mainSubject = if (subject.contains("(") && subject.contains(")")) {
                subject.substringBefore("(").trim()
            } else {
                subject
            }

            // 모든 교시를 동일한 스타일로 표시 (현재 교시 하이라이팅 제거)
            val displayText = "<b>${periodNum}교시</b> $mainSubject"

            builder.append(displayText)

            if (i < timetableData.size - 1) {
                builder.append("<br/>")
            }
        }

        return android.text.Html.fromHtml(builder.toString(), android.text.Html.FROM_HTML_MODE_LEGACY)
    }

    // 4칸 이상 넓은 위젯용 레이아웃 - 일반 레이아웃과 동일
    private fun buildWideDisplay(timetableData: ArrayList<String>, currentPeriod: Int, isDarkMode: Boolean = false): CharSequence {
        return buildTimetableDisplay(timetableData, currentPeriod, isDarkMode)
    }

    private fun adjustTextSizeForWidget(views: RemoteViews, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        try {
            val options: Bundle = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 110)
            val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110)

            // 위젯 크기에 따른 텍스트 크기 계산
            val titleSize = when {
                minWidth >= 210 -> 18f // 3칸 이상
                minWidth >= 140 -> 16f // 2칸
                else -> 14f // 1칸 (현실적으로 사용 안됨)
            }

            val contentSize = when {
                minWidth >= 210 -> 14f // 3칸 이상
                minWidth >= 140 -> 13f // 2칸
                else -> 12f // 1칸
            }
            
            val dateSize = when {
                minWidth >= 210 -> 14f // 3칸 이상
                minWidth >= 140 -> 13f // 2칸
                else -> 12f // 1칸
            }

            // 텍스트 크기 적용
            views.setTextViewTextSize(R.id.widget_timetable_title, TypedValue.COMPLEX_UNIT_SP, titleSize)
            views.setTextViewTextSize(R.id.widget_timetable_content, TypedValue.COMPLEX_UNIT_SP, contentSize)
            views.setTextViewTextSize(R.id.widget_timetable_date, TypedValue.COMPLEX_UNIT_SP, dateSize)
        } catch (e: Exception) {
            // 크기 정보를 가져올 수 없는 경우 기본값 사용
            views.setTextViewTextSize(R.id.widget_timetable_title, TypedValue.COMPLEX_UNIT_SP, 16f)
            views.setTextViewTextSize(R.id.widget_timetable_content, TypedValue.COMPLEX_UNIT_SP, 13f)
            views.setTextViewTextSize(R.id.widget_timetable_date, TypedValue.COMPLEX_UNIT_SP, 12f)
        }
    }

    override fun onAppWidgetOptionsChanged(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        // 크기가 변경될 때마다 위젯 업데이트
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }

    companion object {
        const val ACTION_WIDGET_UPDATE = "kr.ny64.slunchv2.TIMETABLE_WIDGET_UPDATE"
        const val ACTION_TIMETABLE_DATA_UPDATE = "kr.ny64.slunchv2.TIMETABLE_DATA_UPDATE"
        const val EXTRA_TIMETABLE_DATA = "timetable_data"
        const val EXTRA_CURRENT_PERIOD = "current_period"

        fun updateWidgets(context: Context, timetableData: ArrayList<String>, currentPeriod: Int) {
            val intent = Intent(ACTION_TIMETABLE_DATA_UPDATE)
            intent.putStringArrayListExtra(EXTRA_TIMETABLE_DATA, timetableData)
            intent.putExtra(EXTRA_CURRENT_PERIOD, currentPeriod)
            context.sendBroadcast(intent)
        }
    }
}