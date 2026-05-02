import {Stack, Image, Text, Center, Popover} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";

interface PersonaBadgesProps {
    firstName: string;
    lastName: string;
    position: string;
    photoID: string;
    linkedIn: string;
    quote: string;
}

export function PeopleCard({ firstName, lastName, position, photoID, linkedIn, quote }: PersonaBadgesProps) {
    const [opened, { close, open }] = useDisclosure(false);
    console.log(opened);

    return (
        <>
            <Stack>
                <Popover
                    width={250}
                    position="top"
                    withArrow shadow="md"
                    opened={opened}>
                    <Popover.Target>
                        <a href={linkedIn} target="_blank" rel="noopener noreferrer">
                            <Image
                                onMouseEnter={open}
                                onMouseLeave={close}
                                ta="center"
                                w="200px"
                                h="200px"
                                src={`/people/${photoID}`}
                                fallbackSrc = "/people/none.jpg"
                                radius="50%"
                                style={{
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    backgroundColor: 'white',
                                    border: '1px solid #dee2e6',
                                }}
                            />
                        </a>
                    </Popover.Target>
                    <Popover.Dropdown>
                        <Text ta="center">{quote}</Text>
                    </Popover.Dropdown>
                </Popover>
                <Center>
                    <Text>
                        {firstName} {lastName}
                    </Text>
                </Center>
                <Center>
                    <Text>
                        {position}
                    </Text>
                </Center>


            </Stack>
        </>
    )
}
