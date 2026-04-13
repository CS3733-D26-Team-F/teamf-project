import {Group, SegmentedControl} from "@mantine/core";
import {IconLayoutGrid, IconList} from "@tabler/icons-react";

type ViewToggleProps = {
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
}

export function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
    return (
        <SegmentedControl value={viewMode} onChange={val => setViewMode(val as 'grid' | 'list')}
                          data={[
                              {
                                  label: (
                                      <Group gap={4}>
                                          <IconLayoutGrid size={16} />
                                          <span>Grid</span>
                                      </Group>
                                  ),
                                  value: 'grid',
                              },
                              {
                                  label: (
                                      <Group gap={4}>
                                          <IconList size={16} />
                                          <span>List</span>
                                      </Group>
                                  ),
                                  value: 'list',
                              },
                          ]}
        />
    )
}