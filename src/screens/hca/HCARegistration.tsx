import React from 'react';
import { Screen, H1, Card, Text, Button } from '../../components/Ui';
export default function HCARegistration() {
return (
<Screen>
<H1>HCA Registration</H1>
<Card>
<Text muted>Register to be a Health Care Advocate at pregnantandblack.com</Text>
<Button label="Request Approval" />
</Card>
</Screen>
);
}