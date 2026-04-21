import { IconBrandInstagram, IconBrandFacebook, IconBrandLinkedin } from '@tabler/icons-react';
import { ActionIcon, Container, Group, Text } from '@mantine/core';
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import classes from '../FooterLinks.module.css';

// Footer link groups are defined as data so the layout stays easy to update.
const data = [
    {
        title: 'Learn More',
        links: [
            { label: 'Our Website', link: 'https://www.hanover.com/' },
            { label: 'Connect on LinkedIn', link: 'https://www.linkedin.com/company/the-hanover-insurance-group' },
            { label: 'Facebook', link: 'https://www.facebook.com/hanoverinsurance/' },
            { label: 'Instagram', link: 'https://www.instagram.com/accounts/login/?next=https%3A%2F%2Fwww.instagram.com%2Fthe.hanover%2F&is_from_rle' },
        ],
    },
];

export function Footer() {
    // Build the footer sections from the data above so links and headings stay in sync.
    const groups = data.map((group) => {
        const links = group.links.map((link, index) => (
            <Text<'a'>
                key={index}
                className={classes.link}
                component="a"
                href={link.link}
            >
                {link.label}
            </Text>
        ));

        return (
            <div className={classes.wrapper} key={group.title}>
                {/* Each footer group contains a heading, text links, and social icons. */}
                <Text className={classes.title}><b>{group.title}</b></Text>
                {links}
                <Group gap={0} className={classes.social} justify="flex-end" wrap="nowrap">
                    <ActionIcon component="a" size="lg" color="white" variant="subtle" aria-label="LinkedIn" href='https://www.linkedin.com/company/the-hanover-insurance-group'>
                        <IconBrandLinkedin size={18} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon component="a" size="lg" color="white" variant="subtle" aria-label="Facebook" href='https://www.facebook.com/hanoverinsurance/'>
                        <IconBrandFacebook size={18} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon component="a" size="lg" color="white" variant="subtle" aria-label="Instagram" href='https://www.instagram.com/accounts/login/?next=https%3A%2F%2Fwww.instagram.com%2Fthe.hanover%2F&is_from_rle'>
                        <IconBrandInstagram size={18} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </div>
        );
    });

    return (
        <footer className={classes.footer}>
            <Container className={classes.inner}>
                <div className={classes.logo}>
                    {/* Company logo and address are shown together as the primary footer identity block. */}
                    <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                    <br />
                    <Text size="s" c="white" className={classes.description} style={{ whiteSpace: 'pre-line' }}>
                        440 Lincoln St
                        Worcester, MA 01653
                    </Text>
                </div>
                <div className={classes.groups}>{groups}</div>
            </Container>
            {/* Reserved footer area for future content or legal links. */}
            <Container className={classes.afterFooter} >

            </Container>
        </footer>
    );
}