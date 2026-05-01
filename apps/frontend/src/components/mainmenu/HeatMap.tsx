import {useEffect, useMemo, useState} from 'react';
import {Paper, Loader, Center, Text, Group} from '@mantine/core';
import { Heatmap } from '@mantine/charts';
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
dayjs.locale('en');
import { useApi } from "../api.ts";
import { DOMAIN } from '../../const';
import {useTranslation} from "react-i18next";
import {HelpModal} from "./StatsPopup.tsx";

export function HeatMap() {
    const {t, i18n } = useTranslation();
    const [HeatmapData, setHeatmapData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const api = useApi();

    //6 month window
    const { startDate, endDate } = useMemo(() => ({
        startDate: dayjs().subtract(6, 'month').toDate(),
        endDate: dayjs().toDate()
    }), []);

    const localeMap: Record <string, string> = {
        'eng': 'en',
        'esp': 'es',
        'french': 'fr',
        'mandarin': 'zh-cn',
        'arabic': 'ar',
        'hindi': 'hi',
        'bengali': 'bn',
        'russian': 'ru',
        'turkish': 'tr',
        'irish': 'ga',
    };

    const currentLocale = useMemo(() => {
        const locale = localeMap[i18n.language] ?? 'en';
        dayjs.locale(locale);
        return locale;
    }, [i18n.language]);


    useEffect(() => {
        const fetchHeatmapData = async () => {
            try {
                const res = await api(`${DOMAIN}/contentforms`);
                const fileData = await res.json();

                const dateCounts: Record<string, number> = {};

                fileData.forEach((file: any) => {
                    const dateStr = dayjs(file.date_modified).format('YYYY-MM-DD');
                    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                });

                setHeatmapData(dateCounts);
            } catch (error) {
                console.error(t('heat_error'), error);
            } finally {
                setLoading(false);
            }
        };

        fetchHeatmapData();
    }, []);

    if (loading) {
        return (
            <Paper withBorder p="xl" radius="md">
                <Center><Loader size="sm" /></Center>
            </Paper>
        );
    }
    return (
        <Paper p="md" radius="md" w="100%" h="100%">
            <Group mb = "md">
                <Text fw={900} size="xl" >
                    {t('heat_activity')}
                </Text>
                <HelpModal title={t('activity_heatmap')} inline>
                    <Text>{t("activity_heatmap_tip")}</Text>
                </HelpModal>
            </Group>

            <Heatmap
                key = {currentLocale}
                data={HeatmapData}
                startDate={startDate}
                endDate={endDate}
                colors={[
                    'var(--pale-sky)',
                    'var(--fresh-sky)',
                    'var(--sapphire)',
                    'var(--yale-blue)',
                ]}
                getRectProps={({ value }) =>
                    value === null || value === 0
                        ? { fill: '#D3D3D3' }
                        : {}
                }
                rectSize={18}
                withTooltip
                withMonthLabels
                getTooltipLabel={({ date, value }) =>
                    `${dayjs(date).format('DD MMM, YYYY')} – ${value === null || value === 0 ? t('heat_noCont') : `${value} ${t('heat_cont')}${value > 1 ? 's' : ''}`}`
                }/>
        </Paper>
    );
}