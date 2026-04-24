import {Stack, Image, Text, Center} from "@mantine/core";

interface PersonaBadgesProps {
    firstName: string;
    lastName: string;
    position: string;
    photoURL: string;
}

export function PeopleCard({ firstName, lastName, position, photoURL }: PersonaBadgesProps) {
    return (
        <>
            <Stack>
                <Image
                    ta="center"
                    w="200px"
                    h="200px"
                    src={`../../public/people/${photoURL}`}
                    fallbackSrc = "../../public/people/none.jpg"
                    radius="50%"
                    style={{
                        objectFit: 'cover',
                        objectPosition: 'center',
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                    }}
                />
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