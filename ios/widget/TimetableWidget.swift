//
//  TimetableWidget.swift
//  widget
//
//  Created by ny64 on 12/5/25.
//

import WidgetKit
import SwiftUI
import UIKit
import AppIntents

// MARK: - App Intent

struct RefreshTimetableIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "시간표 새로고침"
    
    func perform() async throws -> some IntentResult {
        WidgetCenter.shared.reloadTimelines(ofKind: "TimetableWidget")
        return .result()
    }
}

// MARK: - Models

struct SubjectItem: Codable {
    let name: String
    let changed: Bool
}

struct TimetableData: Decodable {
    let subject: String
    let changed: Bool
    
    enum CodingKeys: String, CodingKey {
        case subject, changed
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        subject = try container.decode(String.self, forKey: .subject)
        changed = try container.decodeIfPresent(Bool.self, forKey: .changed) ?? false
    }
}

struct TimetableResult {
    let subjects: [SubjectItem]
    let displayDate: String
    let daysOffset: Int
}

struct WeeklyTimetableResult: Codable {
    let weeklySubjects: [[SubjectItem]] // [월, 화, 수, 목, 금] 각 요일별 과목 배열
    let todayIndex: Int // 오늘이 몇 번째 요일인지 (0=월, 1=화, ..., 4=금, -1=주말)
    let isNextWeek: Bool
}

// MARK: - Timetable Widget Entry

struct TimetableEntry: TimelineEntry {
    let date: Date
    let timetableResult: TimetableResult?
    let weeklyResult: WeeklyTimetableResult?
    let message: String?
}

// MARK: - Timetable Provider

struct TimetableProvider: AppIntentTimelineProvider {
    typealias Intent = RefreshTimetableIntent
    typealias Entry = TimetableEntry
    
    let appGroupId = "group.kr.ny64.slunchv2"
    
    func placeholder(in context: Context) -> TimetableEntry {
        TimetableEntry(date: Date(), timetableResult: nil, weeklyResult: nil, message: "시간표를 불러오는 중...")
    }

    func snapshot(for configuration: RefreshTimetableIntent, in context: Context) async -> TimetableEntry {
        return TimetableEntry(date: Date(), timetableResult: nil, weeklyResult: nil, message: "시간표를 불러오는 중...")
    }

    func timeline(for configuration: RefreshTimetableIntent, in context: Context) async -> Timeline<TimetableEntry> {
        let currentDate = Date()
        let refreshDate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            let entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: "설정 오류")
            return Timeline(entries: [entry], policy: .after(refreshDate))
        }
        
        guard let comciganSchoolCode = userDefaults.string(forKey: "comciganSchoolCode") else {
            let entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: "앱에서 학교를 설정해주세요.")
            return Timeline(entries: [entry], policy: .after(refreshDate))
        }
        
        let grade = userDefaults.integer(forKey: "grade")
        let classNum = userDefaults.integer(forKey: "classNum")
        
        if grade == 0 || classNum == 0 {
            let entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: "앱에서 학급을 설정해주세요.")
            return Timeline(entries: [entry], policy: .after(refreshDate))
        }
        
        // 위젯 크기에 따라 다른 데이터 로드
        if context.family == .systemLarge {
            // 큰 위젯: 주간 시간표
            let result = await fetchWeeklyTimetableAsync(schoolCode: comciganSchoolCode, grade: grade, classNum: classNum)
            let entry: TimetableEntry
            switch result {
            case .success(let weeklyResult):
                entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: weeklyResult, message: nil)
            case .failure(let error):
                entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: error.localizedDescription)
            }
            return Timeline(entries: [entry], policy: .after(refreshDate))
        } else {
            // 작은/중간 위젯: 하루 시간표
            let result = await fetchTimetableWithOffsetAsync(schoolCode: comciganSchoolCode, grade: grade, classNum: classNum, dayOffset: 0)
            let entry: TimetableEntry
            switch result {
            case .success(let timetableResult):
                entry = TimetableEntry(date: currentDate, timetableResult: timetableResult, weeklyResult: nil, message: nil)
            case .failure(let error):
                entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: error.localizedDescription)
            }
            return Timeline(entries: [entry], policy: .after(refreshDate))
        }
    }
    
    private func fetchWeeklyTimetableAsync(schoolCode: String, grade: Int, classNum: Int) async -> Result<WeeklyTimetableResult, Error> {
        let dateFormatter = DateFormatter()
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        dateFormatter.dateFormat = "yyyyMMdd"
        let currentDateString = dateFormatter.string(from: Date())
        
        let cacheKey = "weeklyTimetableCache_\(schoolCode)_\(grade)_\(classNum)_\(currentDateString)"
        
        if let userDefaults = UserDefaults(suiteName: appGroupId),
           let cachedData = userDefaults.data(forKey: cacheKey) {
            do {
                let cachedResult = try JSONDecoder().decode(WeeklyTimetableResult.self, from: cachedData)
                return .success(cachedResult)
            } catch {
                // 캐시 파싱 실패 시 계속 진행
            }
        }
        
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: "Asia/Seoul")!
        
        let todayWeekday = calendar.component(.weekday, from: Date())
        let todayIndex: Int
        
        switch todayWeekday {
        case 2: todayIndex = 0
        case 3: todayIndex = 1
        case 4: todayIndex = 2
        case 5: todayIndex = 3
        case 6: todayIndex = 4
        default: todayIndex = -1
        }
        
        let urlString = "https://slunch-v2.ny64.kr/comcigan/timetable?schoolCode=\(schoolCode)&grade=\(grade)&class=\(classNum)"
        
        guard let url = URL(string: urlString) else {
            return .failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
        }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let weeklyData = try JSONDecoder().decode([[TimetableData]].self, from: data)
            
            var weeklySubjects: [[SubjectItem]] = []
            for dayData in weeklyData {
                var subjects: [SubjectItem] = []
                for period in dayData {
                    if !period.subject.isEmpty && period.subject != "null" {
                        let subjectItem = SubjectItem(name: period.subject.replacingOccurrences(of: "없음", with: "-"), changed: period.changed)
                        subjects.append(subjectItem)
                    }
                }
                weeklySubjects.append(subjects)
            }
            
            while weeklySubjects.count < 5 {
                weeklySubjects.append([])
            }
            
            let result = WeeklyTimetableResult(
                weeklySubjects: weeklySubjects,
                todayIndex: todayIndex,
                isNextWeek: false
            )
            
            // 캐시 저장
            if let userDefaults = UserDefaults(suiteName: appGroupId),
               let encodedData = try? JSONEncoder().encode(result) {
                userDefaults.set(encodedData, forKey: cacheKey)
            }
            
            return .success(result)
        } catch {
            // 네트워크 오류 시 이전 캐시 사용 (어제)
            if let yesterday = calendar.date(byAdding: .day, value: -1, to: Date()) {
                let yesterdayString = dateFormatter.string(from: yesterday)
                let yesterdayKey = "weeklyTimetableCache_\(schoolCode)_\(grade)_\(classNum)_\(yesterdayString)"
                if let userDefaults = UserDefaults(suiteName: appGroupId),
                   let yesterdayData = userDefaults.data(forKey: yesterdayKey) {
                    do {
                        let yesterdayResult = try JSONDecoder().decode(WeeklyTimetableResult.self, from: yesterdayData)
                        return .success(yesterdayResult)
                    } catch {
                        return .failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "파싱 오류"]))
                    }
                }
            }
            return .failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "네트워크 오류"]))
        }
    }
    
    private func fetchTimetableWithOffsetAsync(schoolCode: String, grade: Int, classNum: Int, dayOffset: Int) async -> Result<TimetableResult, Error> {
        if dayOffset > 7 {
            return .failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "시간표가 없습니다."]))
        }
        
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: "Asia/Seoul")!
        guard let targetDate = calendar.date(byAdding: .day, value: dayOffset, to: Date()) else {
            return .failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "날짜 계산 오류"]))
        }
        
        let weekday = calendar.component(.weekday, from: targetDate)
        
        if weekday == 1 || weekday == 7 {
            return await fetchTimetableWithOffsetAsync(schoolCode: schoolCode, grade: grade, classNum: classNum, dayOffset: dayOffset + 1)
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        dateFormatter.dateFormat = "M/d"
        let displayDate = dateFormatter.string(from: targetDate)
        
        let urlString = "https://slunch-v2.ny64.kr/comcigan/timetable?schoolCode=\(schoolCode)&grade=\(grade)&class=\(classNum)"
        
        guard let url = URL(string: urlString) else {
            return .failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
        }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let weeklyData = try JSONDecoder().decode([[TimetableData]].self, from: data)
            
            let dayIndex: Int
            switch weekday {
            case 2: dayIndex = 0
            case 3: dayIndex = 1
            case 4: dayIndex = 2
            case 5: dayIndex = 3
            case 6: dayIndex = 4
            default: dayIndex = -1
            }
            
            if dayIndex < 0 || dayIndex >= weeklyData.count {
                return await fetchTimetableWithOffsetAsync(schoolCode: schoolCode, grade: grade, classNum: classNum, dayOffset: dayOffset + 1)
            }
            
            let dayData = weeklyData[dayIndex]
            var subjects: [SubjectItem] = []
            
            for period in dayData {
                if !period.subject.isEmpty && period.subject != "null" {
                    let subjectItem = SubjectItem(name: period.subject, changed: period.changed)
                    subjects.append(subjectItem)
                }
            }
            
            if subjects.isEmpty {
                return await fetchTimetableWithOffsetAsync(schoolCode: schoolCode, grade: grade, classNum: classNum, dayOffset: dayOffset + 1)
            } else {
                let result = TimetableResult(subjects: subjects, displayDate: displayDate, daysOffset: dayOffset)
                return .success(result)
            }
        } catch {
            return await fetchTimetableWithOffsetAsync(schoolCode: schoolCode, grade: grade, classNum: classNum, dayOffset: dayOffset + 1)
        }
    }
}

// MARK: - Timetable Widget View

struct TimetableWidgetEntryView: View {
    var entry: TimetableProvider.Entry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme
    
    private var primaryTextColor: Color {
        colorScheme == .dark ? Color.white : Color(red: 0.094, green: 0.094, blue: 0.094)
    }
    
    private var accentColor: Color {
        Color(red: 0.475, green: 0.337, blue: 0.988)
    }
    
    private var changedColor: Color {
        if colorScheme == .dark {
            Color(red: 186/255, green: 166/255, blue: 255/255)
        } else {
            Color(red: 178/255, green: 161/255, blue: 255/255)
        }
    }

    private var dateFontSize: CGFloat {
        family == .systemSmall ? 14 : 14
    }
    
    private var itemFontSize: CGFloat {
        family == .systemSmall ? 14 : 14
    }

    var body: some View {
        if family == .systemLarge {
            weeklyView
        } else {
            dailyView
        }
    }
    
    // MARK: - Daily View (Small/Medium)
    private var dailyView: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let message = entry.message {
                VStack {
                    Spacer()
                    Text(message)
                        .font(.system(size: itemFontSize))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let timetableResult = entry.timetableResult {
                let maxItems = family == .systemSmall ? 7 : 8
                let subjects = Array(timetableResult.subjects.prefix(maxItems))
                
                HStack(alignment: .top, spacing: 0) {
                    VStack(alignment: .leading, spacing: family == .systemSmall ? 2 : 4) {
                        ForEach(Array(subjects.enumerated()), id: \.offset) { index, subject in
                            HStack(spacing: 4) {
                                Text("\(index + 1).")
                                    .font(.system(size: itemFontSize, weight: .medium))
                                    .foregroundColor(.gray)
                                    .frame(width: family == .systemSmall ? 10 : 14, alignment: .trailing)
                                Text(subject.name)
                                    .font(.system(size: itemFontSize))
                                    .foregroundColor(subject.changed ? changedColor : primaryTextColor)
                                    .lineLimit(1)
                            }
                        }
                        
                        if timetableResult.subjects.count > maxItems {
                            Text("외 \(timetableResult.subjects.count - maxItems)교시")
                                .font(.system(size: itemFontSize - 1))
                                .foregroundColor(.gray)
                        }
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(timetableResult.displayDate)
                            .font(.system(size: dateFontSize, weight: .bold))
                            .foregroundColor(accentColor)
                        
                        if timetableResult.daysOffset > 0 {
                            Text(timetableResult.daysOffset == 1 ? "내일" : "+\(timetableResult.daysOffset)일")
                                .font(.system(size: family == .systemSmall ? 10 : 9, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 3)
                                .background(accentColor)
                                .cornerRadius(10)
                        }
                    }
                }
                
                Spacer()
            }
        }
        .padding(4)
    }
    
    // MARK: - Weekly View (Large)
    private var weeklyView: some View {
        VStack(spacing: 0) {
            if let message = entry.message {
                VStack {
                    Spacer()
                    Text(message)
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let weeklyResult = entry.weeklyResult {
                let days = ["월", "화", "수", "목", "금"]
                let maxPeriods = weeklyResult.weeklySubjects.map { $0.count }.max() ?? 0
                
                // 헤더: 제목 + 다음주 뱃지
                HStack(alignment: .center) {
                    Text("시간표")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(primaryTextColor)
                    
                    Spacer()
                    
                    if weeklyResult.isNextWeek {
                        Text("다음 주")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(accentColor)
                            .cornerRadius(12)
                    }
                }
                .padding(.bottom, 8)
                
                // 요일 헤더
                HStack(spacing: 0) {
                    Text("")
                        .frame(width: 20)
                    
                    ForEach(0..<5, id: \.self) { dayIndex in
                        Text(days[dayIndex])
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(dayIndex == weeklyResult.todayIndex ? accentColor : primaryTextColor)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.bottom, 4)
                
                // 시간표 그리드 - 높이 균등 분배
                VStack(spacing: 0) {
                    ForEach(0..<maxPeriods, id: \.self) { period in
                        HStack(spacing: 0) {
                            // 교시 번호
                            Text("\(period + 1)")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.gray)
                                .frame(width: 20)
                            
                            // 각 요일 과목
                            ForEach(0..<5, id: \.self) { dayIndex in
                                let subjects = weeklyResult.weeklySubjects[dayIndex]
                                let subjectItem = period < subjects.count ? subjects[period] : SubjectItem(name: "-", changed: false)
                                
                                Text(subjectItem.name)
                                    .font(.system(size: 13))
                                    .foregroundColor(subjectItem.changed ? changedColor : (dayIndex == weeklyResult.todayIndex ? accentColor : primaryTextColor))
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.6)
                                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                            }
                        }
                        .frame(maxHeight: .infinity)
                        
                        if period < maxPeriods - 1 {
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(height: 0.5)
                        }
                    }
                }
                .frame(maxHeight: .infinity)
            }
        }
        .padding(12)
    }
}

// MARK: - Timetable Widget

struct TimetableWidget: Widget {
    let kind: String = "TimetableWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: RefreshTimetableIntent.self, provider: TimetableProvider()) { entry in
            if #available(iOS 17.0, *) {
                TimetableWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        Color(UIColor.systemBackground)
                    }
            } else {
                TimetableWidgetEntryView(entry: entry)
                    .background(Color(UIColor.systemBackground))
            }
        }
        .configurationDisplayName("시간표")
        .description("오늘의 시간표를 확인하세요.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
