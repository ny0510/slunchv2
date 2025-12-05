#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetBridge, NSObject)

RCT_EXTERN_METHOD(saveSchoolInfo:(NSString *)schoolCode regionCode:(NSString *)regionCode resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveTimetableInfo:(NSString *)comciganSchoolCode grade:(double)grade classNum:(double)classNum resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateWidget:(NSString *)mealData resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(forceUpdateWidget:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getSchoolInfo:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
