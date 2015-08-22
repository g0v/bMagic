#import <Cordova/CDVPlugin.h>

@interface ParseInstallation : CDVPlugin

- (void)getAppName:(CDVInvokedUrlCommand*)command;

- (void)getTimeZone:(CDVInvokedUrlCommand*)command;

- (void)getPackageName:(CDVInvokedUrlCommand*)command;

- (void)getVersionNumber:(CDVInvokedUrlCommand*)command;

@end
