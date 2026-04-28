import {Group, SegmentedControl} from "@mantine/core";
import {IconLayoutGrid, IconList} from "@tabler/icons-react";
import {useTranslation} from "react-i18next";

type ViewToggleProps = {
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
}

export function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
    const {t} = useTranslation();
    return (
        <SegmentedControl value={viewMode} onChange={val => setViewMode(val as 'grid' | 'list')}
                          data={[
                              {
                                  label: (
                                      <Group gap={4} wrap="nowrap" justify="center">
                                          <IconLayoutGrid size={16} />
                                          <span>{t('grid')}</span>
                                      </Group>
                                  ),
                                  value: 'grid',
                              },
                              {
                                  label: (
                                      <Group gap={4} wrap="nowrap" justify="center">
                                          <IconList size={16} />
                                          <span>{t('list')}</span>
                                      </Group>
                                  ),
                                  value: 'list',
                              },
                          ]}
        />
    )
}