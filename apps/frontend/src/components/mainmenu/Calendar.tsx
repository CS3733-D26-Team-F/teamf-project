
import { useEffect, useState } from 'react';
import { Schedule } from '@mantine/schedule';
import dayjs from 'dayjs';
import { DOMAIN } from '../../const';
import { useApi } from "../api.ts";

export function Calendar() {
    const [calendarData, setCalendarData] = useState<any[]>([]);
    const api = useApi();

    useEffect(() => {
        const loadDocs = async () => {
            const res = await api(`${DOMAIN}/contentforms`);
            const fileData = await res.json();
            setCalendarData(fileData);
        };
            loadDocs();
    }, []);

    // Build events from expiration_date
    const reviewDates = calendarData
        .filter(doc => doc.review_date)
        .filter(doc => doc.expiration_date)
        .map(doc => {
            const start = dayjs(doc.review_date).startOf("day");
            const end = dayjs(doc.review_date).endOf("day");
            return {
                id: doc.id,
                title: `${doc.name} Review Date`,
                start: start.toDate(),
                end: end.toDate(),
                allDay: true,
                color: 'var(--fresh-sky)'
            };

        });

    const expirationDates = calendarData
        .filter(doc => doc.expiration_date)
        .map(doc => {
            const date = dayjs(doc.expiration_date).startOf("day");

            return {
                id: `expiration-${doc.id}`,
                title: `${doc.name} Expires`,
                start: date.toDate(),
                end: date.toDate(),
                allDay: true,
                color: 'var(--neutral-red)'
            };
        });

    const events = [...reviewDates, ...expirationDates];



    return (
        <div style={{ width: 1200, margin: "0 auto" }}>
            <Schedule events={events} />
        </div>
    );
}
