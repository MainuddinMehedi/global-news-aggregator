export async function deliverInApp(notification) {
  // In-app delivery is a no-op from the engine's perspective.
  // The Notification row is already in the database and will be served
  // by the API when the user's client polls or fetches it.
  
  // By returning cleanly, the deliveryWorker will mark the NotificationDelivery 
  // for the IN_APP channel as 'delivered'.
  return true;
}
