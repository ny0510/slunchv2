//
//  TimetableWidget.swift
//  widget
//
//  Created by ny64 on 12/5/25.
//

import WidgetKit
import SwiftUI

// MARK: - Models

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
    let subjects: [String]
    let displayDate: String
    let daysOffset: Int
}

struct WeeklyTimetableResult {
    let weeklySubjects: [[String]] // [월, 화, 수, 목, 금] 각 요일별 과목 배열
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

struct TimetableProvider: TimelineProvider {
    let appGroupId = "group.kr.ny64.slunchv2"
    
    func placeholder(in context: Context) -> TimetableEntry {
        TimetableEntry(date: Date(), timetableResult: nil, weeklyResult: nil, message: "시간표를 불러오는 중...")
    }

    func getSnapshot(in context: Context, completion: @escaping (TimetableEntry) -> ()) {
        let entry = TimetableEntry(date: Date(), timetableResult: nil, weeklyResult: nil, message: "시간표를 불러오는 중...")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TimetableEntry>) -> ()) {
        let currentDate = Date()
        let refreshDate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            let entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: "설정 오류")
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
            return
        }
        
        guard let comciganSchoolCode = userDefaults.string(forKey: "comciganSchoolCode") else {
            let entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: "앱에서 학교를 설정해주세요.")
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
            return
        }
        
        let grade = userDefaults.integer(forKey: "grade")
        let classNum = userDefaults.integer(forKey: "classNum")
        
        if grade == 0 || classNum == 0 {
            let entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: "앱에서 학급을 설정해주세요.")
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
            return
        }
        
        // 위젯 크기에 따라 다른 데이터 로드
        if context.family == .systemLarge {
            // 큰 위젯: 주간 시간표
            fetchWeeklyTimetable(schoolCode: comciganSchoolCode, grade: grade, classNum: classNum) { result in
                let entry: TimetableEntry
                switch result {
                case .success(let weeklyResult):
                    entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: weeklyResult, message: nil)
                case .failure(let error):
                    entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: error.localizedDescription)
                }
                
                let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
                completion(timeline)
            }
        } else {
            // 작은/중간 위젯: 하루 시간표
            fetchTimetableWithOffset(schoolCode: comciganSchoolCode, grade: grade, classNum: classNum, dayOffset: 0) { result in
                let entry: TimetableEntry
                switch result {
                case .success(let timetableResult):
                    entry = TimetableEntry(date: currentDate, timetableResult: timetableResult, weeklyResult: nil, message: nil)
                case .failure(let error):
                    entry = TimetableEntry(date: currentDate, timetableResult: nil, weeklyResult: nil, message: error.localizedDescription)
                }
                
                let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
                completion(timeline)
            }
        }
    }
    
    private func fetchWeeklyTimetable(schoolCode: String, grade: Int, classNum: Int, completion: @escaping (Result<WeeklyTimetableResult, Error>) -> Void) {
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: "Asia/Seoul")!
        
        let todayWeekday = calendar.component(.weekday, from: Date())
        let todayIndex: Int
        let useNextWeek: Bool
        
        switch todayWeekday {
        case 2: todayIndex = 0; useNextWeek = false
        case 3: todayIndex = 1; useNextWeek = false
        case 4: todayIndex = 2; useNextWeek = false
        case 5: todayIndex = 3; useNextWeek = false
        case 6: todayIndex = 4; useNextWeek = false
        default: todayIndex = -1; useNextWeek = true
        }
        
        var urlString = "https://slunch-v2.ny64.kr/comcigan/timetable?schoolCode=\(schoolCode)&grade=\(grade)&class=\(classNum)"
        if useNextWeek {
            urlString += "&nextweek=true"
        }
        
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if error != nil {
                completion(.failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "네트워크 오류"])))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "데이터 없음"])))
                return
            }
            
            do {
                let weeklyData = try JSONDecoder().decode([[TimetableData]].self, from: data)
                
                var weeklySubjects: [[String]] = []
                for dayData in weeklyData {
                    var subjects: [String] = []
                    for period in dayData {
                        if !period.subject.isEmpty && period.subject != "null" {
                            let displayText = period.subject + (period.changed ? "*" : "")
                            subjects.append(displayText)
                        }
                    }
                    weeklySubjects.append(subjects)
                }
                
                while weeklySubjects.count < 5 {
                    weeklySubjects.append([])
                }
                
                let result = WeeklyTimetableResult(
                    weeklySubjects: weeklySubjects,
                    todayIndex: useNextWeek ? -1 : todayIndex,
                    isNextWeek: useNextWeek
                )
                completion(.success(result))
            } catch {
                completion(.failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "파싱 오류"])))
            }
        }.resume()
    }
    
    private func fetchTimetableWithOffset(schoolCode: String, grade: Int, classNum: Int, dayOffset: Int, completion: @escaping (Result<TimetableResult, Error>) -> Void) {
        // 최대 7일 뒤까지만 시도
        if dayOffset > 7 {
            completion(.failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "시간표가 없습니다."])))
            return
        }
        
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: "Asia/Seoul")!
        guard let targetDate = calendar.date(byAdding: .day, value: dayOffset, to: Date()) else {
            completion(.failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "날짜 계산 오류"])))
            return
        }
        
        let weekday = calendar.component(.weekday, from: targetDate)
        
        // 주말인 경우 다음 날로 넘어감
        if weekday == 1 || weekday == 7 { // 1 = Sunday, 7 = Saturday
            fetchTimetableWithOffset(schoolCode: schoolCode, grade: grade, classNum: classNum, dayOffset: dayOffset + 1, completion: completion)
            return
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        dateFormatter.dateFormat = "M/d"
        let displayDate = dateFormatter.string(from: targetDate)
        
        // 다음 주인지 확인
        let todayWeekday = calendar.component(.weekday, from: Date())
        var daysUntilWeekend = 0
        
        switch todayWeekday {
        case 2: daysUntilWeekend = 4 // Monday
        case 3: daysUntilWeekend = 3 // Tuesday
        case 4: daysUntilWeekend = 2 // Wednesday
        case 5: daysUntilWeekend = 1 // Thursday
        case 6: daysUntilWeekend = 0 // Friday
        default: daysUntilWeekend = -1 // Weekend
        }
        
        let useNextWeek: Bool
        if todayWeekday == 1 || todayWeekday == 7 {
            useNextWeek = true
        } else {
            useNextWeek = dayOffset > daysUntilWeekend
        }
        
        var urlString = "https://slunch-v2.ny64.kr/comcigan/timetable?schoolCode=\(schoolCode)&grade=\(grade)&class=\(classNum)"
        if useNextWeek {
            urlString += "&nextweek=true"
        }
        
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(NSError(domain: "TimetableWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "네트워크 오류"])))
                return
            }
            
            guard let data = data else {
                self.fetchTimetableWithOffset(schoolCode: schoolCode, grade: grade, classNum: classNum, dayOffset: dayOffset + 1, completion: completion)
                return
            }
            
            do {
                let weeklyData = try JSONDecoder().decode([[TimetableData]].self, from: data)
                
                // weekday: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
                // API index: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
                let dayIndex: Int
                switch weekday {
                case 2: dayIndex = 0 // Monday
                case 3: dayIndex = 1 // Tuesday
                case 4: dayIndex = 2 // Wednesday
                case 5: dayIndex = 3 // Thursday
                case 6: dayIndex = 4 // Friday
                default: dayIndex = -1
                }
                
                if dayIndex < 0 || dayIndex >= weeklyData.count {
                    self.fetchTimetableWithOffset(schoolCode: schoolCode, grade: grade, classNum: classNum, dayOffset: dayOffset + 1, completion: completion)
                    return
                }
                
                let dayData = weeklyData[dayIndex]
                var subjects: [String] = []
                
                for period in dayData {
                    if !period.subject.isEmpty && period.subject != "null" {
                        let displayText = "\(period.subject)" + (period.changed ? "*" : "")
                        subjects.append(displayText)
                    }
                }
                
                if subjects.isEmpty {
                    self.fetchTimetableWithOffset(schoolCode: schoolCode, grade: grade, classNum: classNum, dayOffset: dayOffset + 1, completion: completion)
                } else {
                    let result = TimetableResult(subjects: subjects, displayDate: displayDate, daysOffset: dayOffset)
                    completion(.success(result))
                }
            } catch {
                self.fetchTimetableWithOffset(schoolCode: schoolCode, grade: grade, classNum: classNum, dayOffset: dayOffset + 1, completion: completion)
            }
        }.resume()
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
                                Text(subject)
                                    .font(.system(size: itemFontSize))
                                    .foregroundColor(primaryTextColor)
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
                                let subject = period < subjects.count ? subjects[period] : ""
                                
                                Text(subject)
                                    .font(.system(size: 13))
                                    .foregroundColor(dayIndex == weeklyResult.todayIndex ? accentColor : primaryTextColor)
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
        StaticConfiguration(kind: kind, provider: TimetableProvider()) { entry in
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
