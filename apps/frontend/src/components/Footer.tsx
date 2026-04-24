import { IconBrandInstagram, IconBrandFacebook, IconBrandLinkedin } from '@tabler/icons-react';
import { ActionIcon, Container, Group, Text } from '@mantine/core';
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import classes from '../FooterLinks.module.css';
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";



    export function Footer() {
        const {t} = useTranslation();
        const data = [
            {
                title: t('learn_more'),
                links: [
                    {label: t('our_website'), link: 'https://www.hanover.com/'},
                    {label: t('connect_linkedin'), link: 'https://www.linkedin.com/company/the-hanover-insurance-group'},
                    {label: t('facebook'), link: 'https://www.facebook.com/hanoverinsurance/'},
                    {
                        label: t('instagram'),
                        link: 'https://www.instagram.com/accounts/login/?next=https%3A%2F%2Fwww.instagram.com%2Fthe.hanover%2F&is_from_rle'
                    },
                ],
            },
        ];

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
                    <Text className={classes.title}><b>{group.title}</b></Text>
                    {links}
                    <Group gap={0} className={classes.social} justify="flex-end" wrap="nowrap">
                        <ActionIcon component="a" size="lg" color="white" variant="subtle" aria-label="LinkedIn"
                                    href='https://www.linkedin.com/company/the-hanover-insurance-group'>
                            <IconBrandLinkedin size={18} stroke={1.5}/>
                        </ActionIcon>
                        <ActionIcon component="a" size="lg" color="white" variant="subtle" aria-label="Facebook"
                                    href='https://www.facebook.com/hanoverinsurance/'>
                            <IconBrandFacebook size={18} stroke={1.5}/>
                        </ActionIcon>
                        <ActionIcon component="a" size="lg" color="white" variant="subtle" aria-label="Instagram"
                                    href='https://www.instagram.com/accounts/login/?next=https%3A%2F%2Fwww.instagram.com%2Fthe.hanover%2F&is_from_rle'>
                            <IconBrandInstagram size={18} stroke={1.5}/>
                        </ActionIcon>
                    </Group>
                </div>
            );
        });

        return (
            <footer className={classes.footer}>
                <Container className={classes.inner}>
                    <div className={classes.logo}>
                        <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo"/>
                        <br/>
                        <Text size="s" c="white" className={classes.description} style={{whiteSpace: 'pre-line'}}>
                            440 Lincoln St
                            Worcester, MA 01653
                        </Text>
                    </div>
                    <div className={classes.groups}>
                        {groups}
                        <div className={classes.footerGroup}>
                            <Text className={classes.title}>CS 3733 Creditentials</Text>
                            <Link to="/about" className={classes.link}>About</Link>
                            <Link to="/credit" className={classes.link}>Credits</Link>
                        </div>
                    </div>
                </Container>
                <Container className={classes.afterFooter}>

                </Container>
            </footer>
        );
}
