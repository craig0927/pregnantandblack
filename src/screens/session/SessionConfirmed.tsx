import React from 'react';
import { Screen, H1, Text } from '../../components/Ui';
import { useRoute } from '@react-navigation/native';


export default function SessionConfirmed() {
const route = useRoute<any>();
const { advocateName = 'Jane', date = '01/02/03', time = '01:00 PM' } = route.params || {};
return (
<Screen>
<H1>Session Confirmed</H1>
<Text>Your meeting request with {advocateName} is confirmed.</Text>
<Text>Add this event to your calendar — {date} at {time}</Text>
</Screen>
);
}