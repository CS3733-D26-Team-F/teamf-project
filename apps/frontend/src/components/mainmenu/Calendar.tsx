import {useEffect, useState} from 'react';
import {Schedule} from '@mantine/schedule';
import dayjs from 'dayjs';
import 'dayjs/locale/es';      //spanish
import 'dayjs/locale/fr';      //french
import 'dayjs/locale/zh-cn';  //mandarin
import 'dayjs/locale/ar';     //arabic
import 'dayjs/locale/hi';     //hindi
import 'dayjs/locale/bn';     //bengali
import 'dayjs/locale/ru';      //russian
import 'dayjs/locale/tr';      //turkish
import 'dayjs/locale/ga';      //irish
import {DOMAIN} from '../../const';
import {useApi} from "../api.ts";
import {useTranslation} from "react-i18next";
import {DatesProvider} from "@mantine/dates";
import { Text } from "@mantine/core";
import { HelpModal } from "./StatsPopup.tsx";

export function Calendar() {
    const {t, i18n} = useTranslation();
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

    const localeMap: Record<string, string> = {
        'eng': 'en',
        'esp': 'es',
        'mandarin': 'zh-cn',
        'hindi': 'hi',
        'french': 'fr',
        'arabic': 'ar',
        'bengali': 'bn',
        'russian': 'ru',
        'turkish': 'tr',
        'irish': 'ga',
    };

    const dayjsLocale = localeMap[i18n.language] || 'en';

    // Build events from expiration_date

    const expirationDates = calendarData
        .filter(doc => doc.expiration_date)
        .map(doc => {
            const date = dayjs(doc.expiration_date).startOf("day");

            return {
                id: `expiration-${doc.id}`,
                title: `${doc.name} ${t('expires')}`,
                start: date.toDate(),
                end: date.endOf("day").toDate(),
                allDay: true,
                color: 'var(--neutral-red)'
            };
        });

    const events = [...expirationDates];


    return (
        <DatesProvider settings={{locale: dayjsLocale}}>
            <div style={{width: 1200, margin: "0 auto", position: 'relative'}}>
                <div style={{ position: 'absolute', left: 300, zIndex: 10 }}>
                    <HelpModal title="Calendar" inline>
                        <Text>Shows expiration dates for all documents.</Text>
                    </HelpModal>
                </div>
                <Schedule key={i18n.language} events={events} defaultView="month"
                          labels={{
                              today: t('today'),
                              month: t('month'),
                              week: t('week'),
                              day: t('day'),
                              year: t('year')
                          }}
                          locale={localeMap[i18n.language || 'en']}
                />
            </div>
        </DatesProvider>
    );
}
