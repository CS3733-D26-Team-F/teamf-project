import { ErrorOutline, AttachMoney, Loop, Work, CalendarMonth, Image } from '@mui/icons-material';
import {LinksDemo, LinksWithProps, type MenuItem} from "../LinkBubbles.tsx";
import {useEffect, useState} from "react";


const persona = localStorage.getItem("persona");
const AnalystLinks: MenuItem[] = LinksDemo(persona);

export function LinksDemo

