import React from 'react';
import { Screen, H1, Card, Text, Button } from '../../components/Ui';
export default function Availability() {
return (
<Screen>
<H1>Set Availability</H1>
<Card>
<Text>Mon | Tue | Wed | Thu | Fri | Sat | Sun</Text>
<Text>January — 1 2 3 4 5 6 7</Text>
<Button label="Save Availability" />
</Card>
</Screen>
);
}