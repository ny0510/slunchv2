//
//  widget.swift
//  widget
//
//  Created by ny64 on 12/5/25.
//

import WidgetKit
import SwiftUI
import UIKit

struct Provider: TimelineProvider {
    let appGroupId = "group.kr.ny64.slunchv2"
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), meal: nil, message: "급식 정보를 불러오는 중...")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), meal: nil, message: "급식 정보를 불러오는 중...")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        // Refresh every hour
        let refreshDate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
        
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            let entry = SimpleEntry(date: currentDate, meal: nil, message: "설정 오류")
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
            return
        }
        
        guard let schoolCode = userDefaults.string(forKey: "schoolCode"),
              let regionCode = userDefaults.string(forKey: "regionCode") else {
            let entry = SimpleEntry(date: currentDate, meal: nil, message: "앱에서 학교를 설정해주세요.")
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
            return
        }
        
        fetchMeal(schoolCode: schoolCode, regionCode: regionCode, date: currentDate) { result in
            let entry: SimpleEntry
            switch result {
            case .success(let meals):
                // Find lunch (usually type "중식") or just take the first one if only one exists
                let lunch = meals.first { $0.type == "중식" } ?? meals.first
                
                if let lunch = lunch {
                    entry = SimpleEntry(date: currentDate, meal: lunch, message: nil)
                } else {
                    entry = SimpleEntry(date: currentDate, meal: nil, message: "급식 정보가 없습니다.")
                }
            case .failure(let error):
                // If error, try to show cached data or error message
                entry = SimpleEntry(date: currentDate, meal: nil, message: "오류 발생")
                print("Widget fetch error: \(error)")
            }
            
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
        }
    }
    
    func fetchMeal(schoolCode: String, regionCode: String, date: Date, completion: @escaping (Result<[Meal], Error>) -> Void) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy"
        let year = dateFormatter.string(from: date)
        dateFormatter.dateFormat = "MM"
        let month = dateFormatter.string(from: date)
        dateFormatter.dateFormat = "dd"
        let day = dateFormatter.string(from: date)
        
        let urlString = "https://slunch-v2.ny64.kr/neis/meal?schoolCode=\(schoolCode)&regionCode=\(regionCode)&year=\(year)&month=\(month)&day=\(day)"
        
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No Data", code: 0, userInfo: nil)))
                return
            }
            
            do {
                // Try to decode as [Meal]
                // Note: The API might return different structure if error or empty.
                // Assuming standard success response is [Meal]
                let meals = try JSONDecoder().decode([Meal].self, from: data)
                completion(.success(meals))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

struct Meal: Decodable {
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
        calorie = try container.decodeIfPresent(Double.self, forKey: .calorie)
        
        // Handle meal as [String] or String (if API changes)
        // Based on TS types, it's array.
        // But sometimes APIs return mixed types.
        // Let's assume [String] for now based on typical NEIS API wrappers.
        // If it fails, we might need custom decoding.
        if let mealArray = try? container.decode([String].self, forKey: .meal) {
            meal = mealArray
        } else {
            meal = []
        }
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let meal: Meal?
    let message: String?
}

struct widgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let message = entry.message {
                Text(message)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let meal = entry.meal {
                HStack {
                    Text(meal.type)
                        .font(.headline)
                        .foregroundColor(.blue)
                    Spacer()
                    if let calorie = meal.calorie {
                        Text("\(Int(calorie)) Kcal")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                }
                .padding(.bottom, 2)
                
                GeometryReader { geometry in
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(Array(meal.meal.enumerated()), id: \.offset) { index, menu in
                            // Simple logic to limit items based on size
                            if family == .systemSmall && index < 5 {
                                Text(menu)
                                    .font(.caption)
                                    .lineLimit(1)
                            } else if family != .systemSmall {
                                Text(menu)
                                    .font(.caption)
                                    .lineLimit(1)
                            }
                        }
                        if family == .systemSmall && meal.meal.count > 5 {
                            Text("...")
                                .font(.caption)
                        }
                    }
                }
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color(UIColor.systemBackground)
        }
    }
}

struct widget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                widgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        Color(UIColor.systemBackground)
                    }
            } else {
                widgetEntryView(entry: entry)
                    .padding()
                    .background(Color(UIColor.systemBackground))
            }
        }
        .configurationDisplayName("오늘의 급식")
        .description("오늘의 급식 정보를 확인하세요.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
