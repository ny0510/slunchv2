package kr.ny64.slunchv2.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.text.Html
import android.util.TypedValue
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import kr.ny64.slunchv2.R
import org.json.JSONArray
import org.json.JSONException
import java.util.ArrayList

class TimetableWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return TimetableRemoteViewsFactory(applicationContext, intent)
    }

    private class TimetableRemoteViewsFactory(
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

            val prefs = context.getSharedPreferences(TIMETABLE_WIDGET_PREFS, Context.MODE_PRIVATE)
            val raw = prefs.getString(KEY_TIMETABLE_DATA_PREFIX + appWidgetId, "[]") ?: "[]"
            items = try {
                val array = JSONArray(raw)
                val parsed = ArrayList<String>(array.length())
                for (i in 0 until array.length()) {
                    val value = array.optString(i).trim()
                    if (value.isNotEmpty()) {
                        parsed.add(value)
                    }
                }
                parsed
            } catch (_: JSONException) {
                emptyList()
            }

            contentTextSizeSp = prefs.getFloat(
                KEY_TIMETABLE_CONTENT_SIZE_PREFIX + appWidgetId,
                DEFAULT_CONTENT_SIZE_SP
            ).coerceAtLeast(MIN_CONTENT_SIZE_SP)
        }

        override fun onDestroy() {
            items = emptyList()
        }

        override fun getCount(): Int = items.size

        override fun getViewAt(position: Int): RemoteViews {
            val view = RemoteViews(context.packageName, R.layout.widget_timetable_list_item)
            val subject = items.getOrNull(position) ?: ""
            val displaySubject = if (subject.contains("(") && subject.contains(")")) {
                subject.substringBefore("(").trim()
            } else {
                subject
            }
            val periodNum = position + 1
            val html = "<b>${periodNum}교시</b> $displaySubject"
            val styled = Html.fromHtml(html, Html.FROM_HTML_MODE_LEGACY)

            view.setTextViewText(R.id.widget_timetable_item_text, styled)
            view.setTextViewTextSize(
                R.id.widget_timetable_item_text,
                TypedValue.COMPLEX_UNIT_SP,
                contentTextSizeSp
            )

            val fillIntent = Intent().apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            view.setOnClickFillInIntent(R.id.widget_timetable_item_root, fillIntent)

            return view
        }

        override fun getLoadingView(): RemoteViews? = null

        override fun getViewTypeCount(): Int = 1

        override fun getItemId(position: Int): Long = position.toLong()

        override fun hasStableIds(): Boolean = true

        companion object {
            private const val DEFAULT_CONTENT_SIZE_SP = 13f
            private const val MIN_CONTENT_SIZE_SP = 10f
        }
    }
}
