import Foundation
import WidgetKit

// Type aliases for React Native promise blocks
typealias RCTPromiseResolveBlock = (Any?) -> Void
typealias RCTPromiseRejectBlock = (String?, String?, Error?) -> Void

@objc(WidgetBridge)
class WidgetBridge: NSObject {
  
  let appGroupId = "group.kr.ny64.slunchv2"
  
  @objc
  func saveSchoolInfo(_ schoolCode: String, regionCode: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("Error", "Could not load UserDefaults for App Group", nil)
      return
    }
    
    userDefaults.set(schoolCode, forKey: "schoolCode")
    userDefaults.set(regionCode, forKey: "regionCode")
    
    WidgetCenter.shared.reloadAllTimelines()
    resolve(true)
  }
  
  @objc
  func saveTimetableInfo(_ comciganSchoolCode: String, grade: Double, classNum: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("Error", "Could not load UserDefaults for App Group", nil)
      return
    }
    
    userDefaults.set(comciganSchoolCode, forKey: "comciganSchoolCode")
    userDefaults.set(Int(grade), forKey: "grade")
    userDefaults.set(Int(classNum), forKey: "classNum")
    
    WidgetCenter.shared.reloadAllTimelines()
    resolve(true)
  }
  
  @objc
  func updateWidget(_ mealData: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("Error", "Could not load UserDefaults for App Group", nil)
      return
    }
    
    userDefaults.set(mealData, forKey: "mealData")
    
    WidgetCenter.shared.reloadAllTimelines()
    resolve(true)
  }
  
  @objc
  func forceUpdateWidget(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    WidgetCenter.shared.reloadAllTimelines()
    resolve(true)
  }
  
  @objc
  func getSchoolInfo(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      reject("Error", "Could not load UserDefaults for App Group", nil)
      return
    }
    
    let schoolCode = userDefaults.string(forKey: "schoolCode")
    let regionCode = userDefaults.string(forKey: "regionCode")
    
    resolve(["schoolCode": schoolCode, "regionCode": regionCode])
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
