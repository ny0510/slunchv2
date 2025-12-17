//
//  MealWidget.swift
//  widget
//
//  Created by ny64 on 12/5/25.
//

import WidgetKit
import SwiftUI
import UIKit

// MARK: - Models

struct MealData: Decodable {
    let date: String
    let type: String
    let meal: [String]
    let calorie: Double?
    
    enum CodingKeys: String, CodingKey {
        case date, type, meal, calorie
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        date = try container.decode(String.self, forKey: .date)
        type = try container.decode(String.self, forKey: .type)
        
        // calorie가 문자열 또는 숫자로 올 수 있음
        if let calorieDouble = try? container.decodeIfPresent(Double.self, forKey: .calorie) {
            calorie = calorieDouble
        } else if let calorieString = try? container.decodeIfPresent(String.self, forKey: .calorie),
                  let calorieValue = Double(calorieString) {
            calorie = calorieValue
        } else {
            calorie = nil
        }
        
        if let mealArray = try? container.decode([String].self, forKey: .meal) {
            meal = mealArray
        } else {
            meal = []
        }
    }
}

struct MealResult {
    let meals: [String]
    let displayDate: String
    let mealType: String
    let calorie: Double?
    let daysOffset: Int
}

// MARK: - Meal Widget Entry

struct MealEntry: TimelineEntry {
    let date: Date
    let mealResult: MealResult?
    let message: String?
}

// MARK: - Meal Provider

struct MealProvider: TimelineProvider {
    let appGroupId = "group.kr.ny64.slunchv2"
    
    func placeholder(in context: Context) -> MealEntry {
        MealEntry(date: Date(), mealResult: nil, message: "급식 정보를 불러오는 중...")
    }

    func getSnapshot(in context: Context, completion: @escaping (MealEntry) -> ()) {
        let entry = MealEntry(date: Date(), mealResult: nil, message: "급식 정보를 불러오는 중...")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MealEntry>) -> ()) {
        let currentDate = Date()
        let refreshDate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            let entry = MealEntry(date: currentDate, mealResult: nil, message: "설정 오류")
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
            return
        }
        
        guard let schoolCode = userDefaults.string(forKey: "schoolCode"),
              let regionCode = userDefaults.string(forKey: "regionCode") else {
            let entry = MealEntry(date: currentDate, mealResult: nil, message: "앱에서 학교를 설정해주세요.")
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
            return
        }
        
        // 오후 2시 이후면 내일부터 검색
        let currentHour = Calendar.current.component(.hour, from: currentDate)
        let startOffset = currentHour >= 14 ? 1 : 0
        
        fetchMealWithOffset(schoolCode: schoolCode, regionCode: regionCode, dayOffset: startOffset, baseOffset: startOffset) { result in
            let entry: MealEntry
            switch result {
            case .success(let mealResult):
                entry = MealEntry(date: currentDate, mealResult: mealResult, message: nil)
            case .failure(let error):
                entry = MealEntry(date: currentDate, mealResult: nil, message: error.localizedDescription)
            }
            
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
        }
    }
    
    private func fetchMealWithOffset(schoolCode: String, regionCode: String, dayOffset: Int, baseOffset: Int, completion: @escaping (Result<MealResult, Error>) -> Void) {
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: "Asia/Seoul")!
        guard let targetDate = calendar.date(byAdding: .day, value: dayOffset, to: Date()) else {
            completion(.failure(NSError(domain: "MealWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "날짜 계산 오류"])))
            return
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        
        dateFormatter.dateFormat = "yyyy"
        let year = dateFormatter.string(from: targetDate)
        dateFormatter.dateFormat = "MM"
        let month = dateFormatter.string(from: targetDate)
        dateFormatter.dateFormat = "dd"
        let day = dateFormatter.string(from: targetDate)
        dateFormatter.dateFormat = "M/d"
        let displayDate = dateFormatter.string(from: targetDate)
        
        let urlString = "https://slunch-v2.ny64.kr/neis/meal?schoolCode=\(schoolCode)&regionCode=\(regionCode)&year=\(year)&month=\(month)&day=\(day)"
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "MealWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }

        print("[noobnuby is furry] MealWidget fetching URL: \(urlString)")

        // 시작일 기준 최대 3일 뒤까지만 시도
        if dayOffset > baseOffset + 3 {
            completion(.failure(NSError(domain: "MealWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "급식 정보가 없습니다.\n"+urlString])))
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(NSError(domain: "MealWidget", code: 0, userInfo: [NSLocalizedDescriptionKey: "네트워크 오류"])))
                return
            }
            
            guard let data = data else {
                // 데이터 없으면 다음 날 시도
                self.fetchMealWithOffset(schoolCode: schoolCode, regionCode: regionCode, dayOffset: dayOffset + 1, baseOffset: baseOffset, completion: completion)
                return
            }
            
            do {
                let meals = try JSONDecoder().decode([MealData].self, from: data)
                
                // 중식 우선, 없으면 첫 번째 급식
                let lunch = meals.first { $0.type == "중식" } ?? meals.first
                
                if let lunch = lunch, !lunch.meal.isEmpty {
                    let result = MealResult(
                        meals: lunch.meal,
                        displayDate: displayDate,
                        mealType: lunch.type,
                        calorie: lunch.calorie,
                        daysOffset: dayOffset
                    )
                    completion(.success(result))
                } else {
                    // 급식 없으면 다음 날 시도
                    self.fetchMealWithOffset(schoolCode: schoolCode, regionCode: regionCode, dayOffset: dayOffset + 1, baseOffset: baseOffset, completion: completion)
                }
            } catch {
                // 파싱 실패면 다음 날 시도
                self.fetchMealWithOffset(schoolCode: schoolCode, regionCode: regionCode, dayOffset: dayOffset + 1, baseOffset: baseOffset, completion: completion)
            }
        }.resume()
    }
}

// MARK: - Meal Widget View

struct MealWidgetEntryView: View {
    var entry: MealProvider.Entry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme
    
    private var primaryTextColor: Color {
        colorScheme == .dark ? Color.white : Color(red: 0.094, green: 0.094, blue: 0.094) // #181818
    }
    
    private var accentColor: Color {
        Color(red: 0.475, green: 0.337, blue: 0.988) // #7956FC
    }
    
    private var dateFontSize: CGFloat {
        family == .systemSmall ? 14 : 14
    }
    
    private var itemFontSize: CGFloat {
        family == .systemSmall ? 12 : 14
    }

    var body: some View {
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
            } else if let mealResult = entry.mealResult {
                // Meal Items with date on the side
                let maxItems = family == .systemSmall ? 7 : 8
                let meals = Array(mealResult.meals.prefix(maxItems))
                
                HStack(alignment: .top, spacing: 0) {
                    VStack(alignment: .leading, spacing: family == .systemSmall ? 2 : 4) {
                        ForEach(Array(meals.enumerated()), id: \.offset) { _, menu in
                            Text(menu)
                                .font(.system(size: itemFontSize))
                                .foregroundColor(primaryTextColor)
                                .lineLimit(1)
                        }
                        
                        if mealResult.meals.count > maxItems {
                            Text("외 \(mealResult.meals.count - maxItems)개")
                                .font(.system(size: itemFontSize - 1))
                                .foregroundColor(.gray)
                        }
                    }
                    
                    Spacer()
                    
                    // 오른쪽에 날짜/뱃지 세로 표시
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(mealResult.displayDate)
                            .font(.system(size: dateFontSize, weight: .bold))
                            .foregroundColor(accentColor)
                        
                        if mealResult.daysOffset > 0 {
                            Text(mealResult.daysOffset == 1 ? "내일" : "+\(mealResult.daysOffset)일")
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
}

// MARK: - Meal Widget

struct MealWidget: Widget {
    let kind: String = "MealWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MealProvider()) { entry in
            if #available(iOS 17.0, *) {
                MealWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        Color(UIColor.systemBackground)
                    }
            } else {
                MealWidgetEntryView(entry: entry)
                    .background(Color(UIColor.systemBackground))
            }
        }
        .configurationDisplayName("급식")
        .description("오늘의 급식 정보를 확인하세요.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
