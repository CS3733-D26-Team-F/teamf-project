import { ExpirationWidget } from "../mainmenu/ExpirationWidget.tsx";
import { ContentCurrencyWidget } from "../mainmenu/ContentCurrencyWidget.tsx"
import {Group} from "@mantine/core";


export function DocStatusWidget() {
    return (
        <Group align='flex-start' grow>
            <ExpirationWidget />
            <ContentCurrencyWidget />
        </Group>
    )
}