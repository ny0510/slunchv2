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

class MealWidgetProvider : AppWidgetProvider() {

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

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_meal_layout)

        // 위젯 크기에 따른 텍스트 크기 조정
        adjustTextSizeForWidget(views, appWidgetManager, appWidgetId)

        // 현재 날짜 설정
        val dateFormat = SimpleDateFormat("M/d", Locale.KOREA)
        val currentDate = dateFormat.format(Date())
        views.setTextViewText(R.id.widget_date, currentDate)

        // 클릭 시 위젯 새로고침 - 고유한 request code와 명시적 패키지 설정
        val refreshIntent = Intent(context, MealWidgetProvider::class.java).apply {
            action = ACTION_WIDGET_UPDATE
            setPackage(context.packageName)
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        val refreshPendingIntent = PendingIntent.getBroadcast(
            context,
            appWidgetId * 1000, // 고유한 request code 사용
            refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 전체 위젯 영역에 클릭 리스너 설정
        views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent)
        views.setOnClickPendingIntent(R.id.widget_meal_content, refreshPendingIntent)
        views.setOnClickPendingIntent(R.id.widget_date, refreshPendingIntent)

        // 제목 클릭 시 앱 열기
        val appIntent = Intent(context, MainActivity::class.java)
        val appPendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId * 1000 + 1, // 고유한 request code
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_title, appPendingIntent)

        // 로딩 상태 표시
        views.setTextViewText(R.id.widget_meal_content, "")
        views.setViewVisibility(R.id.widget_loading, android.view.View.VISIBLE)
        appWidgetManager.updateAppWidget(appWidgetId, views)

        // 네이티브에서 직접 급식 데이터 가져오기
        fetchMealDataNatively(context)
    }

    private fun fetchMealDataNatively(context: Context) {
        val apiClient = MealApiClient(context)
        apiClient.fetchTodayMeal { mealData ->
            // UI 스레드에서 위젯 업데이트
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                updateWidgetWithMealData(context, mealData)
            }
        }
    }

    private fun updateWidgetWithMealData(context: Context, mealData: String) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, MealWidgetProvider::class.java)
        )

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_meal_layout)

            // 크기에 따른 텍스트 크기 조정
            adjustTextSizeForWidget(views, appWidgetManager, appWidgetId)

            // 로딩 스피너 숨기기
            views.setViewVisibility(R.id.widget_loading, android.view.View.GONE)

            // 급식 데이터 표시
            views.setTextViewText(R.id.widget_meal_content, mealData)

            // 현재 날짜 업데이트
            val dateFormat = SimpleDateFormat("M/d", Locale.KOREA)
            val currentDate = dateFormat.format(Date())
            views.setTextViewText(R.id.widget_date, currentDate)

            // 클릭 리스너 재설정 (데이터 업데이트 시에도 클릭 이벤트 유지)
            val refreshIntent = Intent(context, MealWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_UPDATE
                setPackage(context.packageName)
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            val refreshPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId * 1000,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // 전체 위젯 영역에 클릭 리스너 설정
            views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_meal_content, refreshPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_date, refreshPendingIntent)

            // 제목 클릭 시 앱 열기
            val appIntent = Intent(context, MainActivity::class.java)
            val appPendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId * 1000 + 1,
                appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_title, appPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    private fun adjustTextSizeForWidget(views: RemoteViews, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        try {
            val options: Bundle = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 110)
            val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110)

            // 위젯 크기에 따른 텍스트 크기 계산 (3칸 크기를 4칸 이상에서도 사용)
            val titleSize = when {
                minWidth >= 210 -> 18f // 3칸 이상
                minWidth >= 140 -> 16f // 2칸
                else -> 14f // 1칸 (현실적으로 사용 안됨)
            }

            val contentSize = when {
                minWidth >= 210 -> 15f // 3칸 이상
                minWidth >= 140 -> 14f // 2칸
                else -> 13f // 1칸
            }

            val dateSize = when {
                minWidth >= 210 -> 14f // 3칸 이상
                minWidth >= 140 -> 13f // 2칸
                else -> 12f // 1칸
            }

            // 텍스트 크기 적용
            views.setTextViewTextSize(R.id.widget_title, TypedValue.COMPLEX_UNIT_SP, titleSize)
            views.setTextViewTextSize(R.id.widget_meal_content, TypedValue.COMPLEX_UNIT_SP, contentSize)
            views.setTextViewTextSize(R.id.widget_date, TypedValue.COMPLEX_UNIT_SP, dateSize)
        } catch (e: Exception) {
            // 크기 정보를 가져올 수 없는 경우 기본값 사용
            views.setTextViewTextSize(R.id.widget_title, TypedValue.COMPLEX_UNIT_SP, 16f)
            views.setTextViewTextSize(R.id.widget_meal_content, TypedValue.COMPLEX_UNIT_SP, 14f)
            views.setTextViewTextSize(R.id.widget_date, TypedValue.COMPLEX_UNIT_SP, 13f)
        }
    }

    override fun onAppWidgetOptionsChanged(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        // 크기가 변경될 때마다 위젯 업데이트
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }

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