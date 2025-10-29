package kr.ny64.slunchv2.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.util.TypedValue
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import kr.ny64.slunchv2.R

class MealWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return MealRemoteViewsFactory(applicationContext, intent)
    }

    private class MealRemoteViewsFactory(
        private val context: Context,
        intent: Intent
    ) : RemoteViewsService.RemoteViewsFactory {

        private val appWidgetId = intent.getIntExtra(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        )
        private var items: List<String> = emptyList()
        private var contentTextSizeSp: Float = DEFAULT_CONTENT_SIZE_SP

        override fun onCreate() {
            // No-op
        }

        override fun onDataSetChanged() {
            if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
                items = emptyList()
                contentTextSizeSp = DEFAULT_CONTENT_SIZE_SP
                return
            }

            val prefs = context.getSharedPreferences(MEAL_WIDGET_PREFS, Context.MODE_PRIVATE)
            val raw = prefs.getString(KEY_MEAL_DATA_PREFIX + appWidgetId, "") ?: ""
            items = raw.replace("\r", "")
                .split("\n")
                .map { it.trim() }
                .filter { it.isNotEmpty() }

            contentTextSizeSp = prefs.getFloat(
                KEY_MEAL_CONTENT_SIZE_PREFIX + appWidgetId,
                DEFAULT_CONTENT_SIZE_SP
            ).coerceAtLeast(MIN_CONTENT_SIZE_SP)
        }

        override fun onDestroy() {
            items = emptyList()
        }

        override fun getCount(): Int = items.size

        override fun getViewAt(position: Int): RemoteViews {
            val view = RemoteViews(context.packageName, R.layout.widget_meal_list_item)
            val text = items.getOrNull(position) ?: ""

            view.setTextViewText(R.id.widget_meal_item_text, text)
            view.setTextViewTextSize(
                R.id.widget_meal_item_text,
                TypedValue.COMPLEX_UNIT_SP,
                contentTextSizeSp
            )

            val fillIntent = Intent().apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            view.setOnClickFillInIntent(R.id.widget_meal_item_root, fillIntent)

            return view
        }

        override fun getLoadingView(): RemoteViews? = null

        override fun getViewTypeCount(): Int = 1

        override fun getItemId(position: Int): Long = position.toLong()

        override fun hasStableIds(): Boolean = true

        companion object {
            private const val DEFAULT_CONTENT_SIZE_SP = 14f
            private const val MIN_CONTENT_SIZE_SP = 10f
        }
    }
}
