import React, { useEffect } from 'react';
import { Alert, Button, Platform, StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowAlert: true
    };
  }
});

async function allowsNotificationsAsync(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

const requestPermissionsAsync =
  async (): Promise<Notifications.NotificationPermissionsStatus> => {
    return await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true
      }
    });
  };

export default function App(): JSX.Element {
  useEffect(() => {
    const configurePushNotifications = async (): Promise<void> => {
      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;
      if (finalStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission required',
          'Push notifications need the appropiate permissions.'
        );
        return;
      }

      const pushTokenData = await Notifications.getExpoPushTokenAsync();
      console.log('pushTokenData ', pushTokenData);

      if (Platform.OS === 'android') {
        void Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT
        });
      }
    };

    void configurePushNotifications();
  }, []);

  useEffect(() => {
    const subscription1 = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('NOTIFICATION RECEIVED');
        console.log('notification ', notification);
        // TODO: How to type username
        const userName = notification.request.content.data.userName as string;
        console.log('userName ', userName);
      }
    );

    const subscription2 = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('NOTIFICATION RESPONSE RECEIVED');
        console.log('response ', response);
        const userName = response.notification.request.content.data
          .userName as string;
        console.log('userName ', userName);
      }
    );

    return () => {
      subscription1.remove();
      subscription2.remove();
    };
  }, []);

  const scheduleNotificationHandler = async (): Promise<void> => {
    const hasPushNotificationPermissionGranted =
      await allowsNotificationsAsync();
    console.log(
      'hasPushNotificationPermissionGranted ',
      hasPushNotificationPermissionGranted
    );

    if (!hasPushNotificationPermissionGranted) {
      await requestPermissionsAsync();
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'My first local notification',
        body: 'This is the body of the notification.',
        data: { userName: 'Carlos' }
      },
      trigger: {
        seconds: 5
      }
    });
    // console.log('test ', test);
  };

  const sendPushNotificationHandler = (): void => {
    void fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: 'ExponentPushToken[xxxx-xxxxx-xxxxx]',
        title: 'Test - sent from a device!',
        body: 'This is a test!'
      })
    });
  };

  return (
    <View style={styles.container}>
      <Button
        title="Schedule Notification"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={async () => {
          await scheduleNotificationHandler();
        }}
      />
      <Button
        title="Schedule Notification"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={sendPushNotificationHandler}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center'
  }
});
