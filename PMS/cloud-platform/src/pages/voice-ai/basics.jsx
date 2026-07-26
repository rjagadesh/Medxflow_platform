import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Text,
  RadioGroup,
  HStack,
  Stack,
  Button,
  VStack,
  Badge,
  IconButton,
  Grid,
  GridItem,
  Flex,
  Input,
  InputGroup,
  Spinner,
  SimpleGrid,
  Checkbox,
  Image,
} from "@chakra-ui/react";
import GenericTable from "../../components/table/table";
import {
  Edit2,
  RefreshCw,
  RotateCcw,
  Phone,
  PhoneCall,
  X,
  Plus,
  Minus,
  Settings2,
} from "lucide-react";
import CustomInput from "@/components/input/input";
import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import { useGetAgentVersions } from "@/hooks/query/useGetAgentVersions";
import { useCreateAgentVersion } from "@/hooks/mutation/useCreateAgentVersion";
import { useUpdateAgentVersion } from "@/hooks/mutation/useUpdateAgentVersion";
import { useUpdateAgentVersionStatus } from "@/hooks/mutation/useUpdateAgentVersionStatus";
import { useCloneAgentVersion } from "@/hooks/mutation/useCloneAgentVersion";
import { toaster } from "@/components/ui/toaster";
import { useForm, Controller } from "react-hook-form";
import { useGetAgentVersionsByApp } from "@/hooks/query/useGetAgentVersionsByApp";
import { useParams, useSearchParams } from "react-router-dom";
import { atobAgentId } from "@/utils/helper";
import { useGetAgentById } from "@/hooks/query/useGetAgentById";
import CustomBreadcrumb from "@/components/breadcrumb/breadcrumb";
import VoiceAiHeader from "./components/voice-ai-header";
import { avatarMap } from "../../assets/avatar";
import BuyNumberDialog from "./components/BuyNumberDialog";

// Telephony Imports
import { Slider } from "@/components/ui/slider";
import { useGetTelephonySettings } from "@/hooks/query/voiceai/useGetTelephonySettings";
import { useUpdateTelephonySettings } from "@/hooks/mutation/voiceai/useUpdateTelephonySettings";
import { useCreateTelephonySettings } from "@/hooks/mutation/voiceai/useCreateTelephonySettings";
import { useGetScalingRouting } from "@/hooks/query/voiceai/UseGetScalingRouting";
import {
  useCreateRoutingScaling,
  useUpdateRoutingScaling,
} from "@/hooks/mutation/voiceai/useUpdateRoutingScaling";
import { useGetMobileNumbers } from "@/hooks/query/voiceai/useGetMobileNumbers";
import { RoutingLifecycleSections } from "@/pages/pms/voiceai/routing_scaling";
import { Span } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { Settings } from "lucide-react";
// import {
//   useBuyNumbers,
//   useGetAvailableNumbers,
//   useGetNumbers,
// } from "@/hooks/query/voiceai/useGetBuyNumbers";

// Mock Data for Versioning Table
const VERSION_DATA = [
  {
    id: 1,
    version: "v1.2",
    status: "Testing",
    createdBy: "Michael C.",
    createdBot: "03/31/2024",
    createdDate: "03/31/2024",
  },
  {
    id: 2,
    version: "v1.1",
    status: "Active",
    createdBy: "John D.",
    createdBot: "03/10/2024",
    createdDate: "03/10/2024",
  },
  {
    id: 3,
    version: "1.0",
    status: "Paused",
    createdBy: "John D.",
    createdBot: "03/10/2024",
    createdDate: "03/10/2024",
  },
];

const LANGUAGE_OPTIONS = [
  {
    label: "Afrikaans",
    value: "Afrikaans",
    avatar: "https://flagcdn.com/w40/za.png",
  },
  {
    label: "Arabic",
    value: "Arabic",
    avatar: "https://flagcdn.com/w40/sa.png",
  },
  {
    label: "Armenian",
    value: "Armenian",
    avatar: "https://flagcdn.com/w40/am.png",
  },
  {
    label: "Assamese",
    value: "Assamese",
    avatar: "https://flagcdn.com/w40/in.png",
  },
  {
    label: "Azerbaijani",
    value: "Azerbaijani",
    avatar: "https://flagcdn.com/w40/az.png",
  },
  {
    label: "Belarusian",
    value: "Belarusian",
    avatar: "https://flagcdn.com/w40/by.png",
  },
  {
    label: "Bengali",
    value: "Bengali",
    avatar: "https://flagcdn.com/w40/bd.png",
  },
  {
    label: "Bosnian",
    value: "Bosnian",
    avatar: "https://flagcdn.com/w40/ba.png",
  },
  {
    label: "Bulgarian",
    value: "Bulgarian",
    avatar: "https://flagcdn.com/w40/bg.png",
  },
  {
    label: "Catalan",
    value: "Catalan",
    avatar: "https://flagcdn.com/w40/es-ct.png",
  },
  {
    label: "Cebuano",
    value: "Cebuano",
    avatar: "https://flagcdn.com/w40/ph.png",
  },
  {
    label: "Chichewa",
    value: "Chichewa",
    avatar: "https://flagcdn.com/w40/mw.png",
  },
  {
    label: "Croatian",
    value: "Croatian",
    avatar: "https://flagcdn.com/w40/hr.png",
  },
  { label: "Czech", value: "Czech", avatar: "https://flagcdn.com/w40/cz.png" },
  {
    label: "Danish",
    value: "Danish",
    avatar: "https://flagcdn.com/w40/dk.png",
  },
  { label: "Dutch", value: "Dutch", avatar: "https://flagcdn.com/w40/nl.png" },
  {
    label: "English",
    value: "English",
    avatar: "https://flagcdn.com/w40/us.png",
  },
  {
    label: "Estonian",
    value: "Estonian",
    avatar: "https://flagcdn.com/w40/ee.png",
  },
  {
    label: "Filipino",
    value: "Filipino",
    avatar: "https://flagcdn.com/w40/ph.png",
  },
  {
    label: "Finnish",
    value: "Finnish",
    avatar: "https://flagcdn.com/w40/fi.png",
  },
  {
    label: "French",
    value: "French",
    avatar: "https://flagcdn.com/w40/fr.png",
  },
  {
    label: "Galician",
    value: "Galician",
    avatar: "https://flagcdn.com/w40/es-ga.png",
  },
  {
    label: "Georgian",
    value: "Georgian",
    avatar: "https://flagcdn.com/w40/ge.png",
  },
  {
    label: "German",
    value: "German",
    avatar: "https://flagcdn.com/w40/de.png",
  },
  { label: "Greek", value: "Greek", avatar: "https://flagcdn.com/w40/gr.png" },
  {
    label: "Gujarati",
    value: "Gujarati",
    avatar: "https://flagcdn.com/w40/in.png",
  },
  { label: "Hausa", value: "Hausa", avatar: "https://flagcdn.com/w40/ng.png" },
  {
    label: "Hebrew",
    value: "Hebrew",
    avatar: "https://flagcdn.com/w40/il.png",
  },
  { label: "Hindi", value: "Hindi", avatar: "https://flagcdn.com/w40/in.png" },
  {
    label: "Hungarian",
    value: "Hungarian",
    avatar: "https://flagcdn.com/w40/hu.png",
  },
  {
    label: "Icelandic",
    value: "Icelandic",
    avatar: "https://flagcdn.com/w40/is.png",
  },
  {
    label: "Indonesian",
    value: "Indonesian",
    avatar: "https://flagcdn.com/w40/id.png",
  },
  { label: "Irish", value: "Irish", avatar: "https://flagcdn.com/w40/ie.png" },
  {
    label: "Italian",
    value: "Italian",
    avatar: "https://flagcdn.com/w40/it.png",
  },
  {
    label: "Japanese",
    value: "Japanese",
    avatar: "https://flagcdn.com/w40/jp.png",
  },
  {
    label: "Javanese",
    value: "Javanese",
    avatar: "https://flagcdn.com/w40/id.png",
  },
  {
    label: "Kannada",
    value: "Kannada",
    avatar: "https://flagcdn.com/w40/in.png",
  },
  {
    label: "Kazakh",
    value: "Kazakh",
    avatar: "https://flagcdn.com/w40/kz.png",
  },
  {
    label: "Korean",
    value: "Korean",
    avatar: "https://flagcdn.com/w40/kr.png",
  },
  {
    label: "Latvian",
    value: "Latvian",
    avatar: "https://flagcdn.com/w40/lv.png",
  },
  {
    label: "Lingala",
    value: "Lingala",
    avatar: "https://flagcdn.com/w40/cd.png",
  },
  {
    label: "Lithuanian",
    value: "Lithuanian",
    avatar: "https://flagcdn.com/w40/lt.png",
  },
  {
    label: "Luxembourgish",
    value: "Luxembourgish",
    avatar: "https://flagcdn.com/w40/lu.png",
  },
  {
    label: "Macedonian",
    value: "Macedonian",
    avatar: "https://flagcdn.com/w40/mk.png",
  },
  { label: "Malay", value: "Malay", avatar: "https://flagcdn.com/w40/my.png" },
  {
    label: "Malayalam",
    value: "Malayalam",
    avatar: "https://flagcdn.com/w40/in.png",
  },
  {
    label: "Mandarin Chinese",
    value: "Mandarin Chinese",
    avatar: "https://flagcdn.com/w40/cn.png",
  },
  {
    label: "Marathi",
    value: "Marathi",
    avatar: "https://flagcdn.com/w40/in.png",
  },
  {
    label: "Nepali",
    value: "Nepali",
    avatar: "https://flagcdn.com/w40/np.png",
  },
  {
    label: "Norwegian",
    value: "Norwegian",
    avatar: "https://flagcdn.com/w40/no.png",
  },
  {
    label: "Pashto",
    value: "Pashto",
    avatar: "https://flagcdn.com/w40/af.png",
  },
  {
    label: "Persian",
    value: "Persian",
    avatar: "https://flagcdn.com/w40/ir.png",
  },
  {
    label: "Polish",
    value: "Polish",
    avatar: "https://flagcdn.com/w40/pl.png",
  },
  {
    label: "Portuguese",
    value: "Portuguese",
    avatar: "https://flagcdn.com/w40/pt.png",
  },
  {
    label: "Punjabi",
    value: "Punjabi",
    avatar: "https://flagcdn.com/w40/in.png",
  },
  {
    label: "Romanian",
    value: "Romanian",
    avatar: "https://flagcdn.com/w40/ro.png",
  },
  {
    label: "Russian",
    value: "Russian",
    avatar: "https://flagcdn.com/w40/ru.png",
  },
  {
    label: "Serbian",
    value: "Serbian",
    avatar: "https://flagcdn.com/w40/rs.png",
  },
  {
    label: "Sindhi",
    value: "Sindhi",
    avatar: "https://flagcdn.com/w40/pk.png",
  },
  {
    label: "Slovak",
    value: "Slovak",
    avatar: "https://flagcdn.com/w40/sk.png",
  },
  {
    label: "Slovenian",
    value: "Slovenian",
    avatar: "https://flagcdn.com/w40/si.png",
  },
  {
    label: "Somali",
    value: "Somali",
    avatar: "https://flagcdn.com/w40/so.png",
  },
  {
    label: "Spanish",
    value: "Spanish",
    avatar: "https://flagcdn.com/w40/es.png",
  },
  {
    label: "Swahili",
    value: "Swahili",
    avatar: "https://flagcdn.com/w40/tz.png",
  },
  {
    label: "Swedish",
    value: "Swedish",
    avatar: "https://flagcdn.com/w40/se.png",
  },
  { label: "Tamil", value: "Tamil", avatar: "https://flagcdn.com/w40/in.png" },
  {
    label: "Telugu",
    value: "Telugu",
    avatar: "https://flagcdn.com/w40/in.png",
  },
  { label: "Thai", value: "Thai", avatar: "https://flagcdn.com/w40/th.png" },
  {
    label: "Turkish",
    value: "Turkish",
    avatar: "https://flagcdn.com/w40/tr.png",
  },
  {
    label: "Ukrainian",
    value: "Ukrainian",
    avatar: "https://flagcdn.com/w40/ua.png",
  },
];

// const TIMEZONE_OPTIONS = [
//   { code: "IST", label: "india standard time" },
//   { code: "EST", label: "eastern standard time" },
//   { code: "EDT", label: "eastern daylight time" },
//   { code: "CST", label: "central standard time" },
//   { code: "CDT", label: "central daylight time" },
//   { code: "MST", label: "mountain standard time" },
//   { code: "MDT", label: "mountain daylight time" },
//   { code: "PST", label: "pacific standard time" },
//   { code: "PDT", label: "pacific daylight time" },
// ].map((tz) => ({ label: `${tz.code} - ${tz.label}`, value: tz.code }));

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
].map((tz) => ({ label: tz, value: tz }));

const VOICE_GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

const VOICE_GENDER_MAP = {
  Male: [
    "Puck",
    "Charon",
    "Fenrir",
    "Orus",
    "Enceladus",
    "Iapetus",
    "Umbriel",
    "Algieba",
    "Algenib",
    "Rasalgethi",
    "Alnilam",
    "Schedar",
    "Achird",
    "Sadachbia",
    "Sadaltager",
  ],
  Female: [
    "Zephyr",
    "Laomedeia",
    "Sulafat",

    "Achernar",
    "Kore",
    "Leda",
    "Aoede",
    "Callirrhoe",
    "Autonoe",
    "Despina",
    "Erinome",
    "Gacrux",
    "Pulcherrima",
    "Zubenelgenubi",
    "Vindemiatrix",
  ],
};

const REAL_TIME_VOICES = [
  "Zephyr",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Alnilam",
  "Schedar",
  "Gacrux",
  "Pulcherrima",
  "Achird",
  "Zubenelgenubi",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat",
].map((voice) => ({
  label: voice,
  value: voice,
  avatar: avatarMap[voice],
}));

const STT_TTS_VOICES_DATA = [
  {
    model_id: "aura-2-agathe-fr",
    voice_name: "Agathe",
    gender: "Female",
    language: "fr",
  },
  {
    model_id: "aura-2-agustina-es",
    voice_name: "Agustina",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-alvaro-es",
    voice_name: "Alvaro",
    gender: "Male",
    language: "es",
  },
  {
    model_id: "aura-2-ama-ja",
    voice_name: "Ama",
    gender: "Female",
    language: "ja",
  },
  {
    model_id: "aura-2-amalthea-en",
    voice_name: "Amalthea",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-andromeda-en",
    voice_name: "Andromeda",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-antonia-es",
    voice_name: "Antonia",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-apollo-en",
    voice_name: "Apollo",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-aquila-es",
    voice_name: "Aquila",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-arcas-en",
    voice_name: "Arcas",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-aries-en",
    voice_name: "Aries",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-asteria-en",
    voice_name: "Asteria",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-athena-en",
    voice_name: "Athena",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-atlas-en",
    voice_name: "Atlas",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-aurelia-de",
    voice_name: "Aurelia",
    gender: "Female",
    language: "de",
  },
  {
    model_id: "aura-2-aurora-en",
    voice_name: "Aurora",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-beatrix-nl",
    voice_name: "Beatrix",
    gender: "Female",
    language: "nl",
  },
  {
    model_id: "aura-2-callista-en",
    voice_name: "Callista",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-carina-es",
    voice_name: "Carina",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-celeste-es",
    voice_name: "Celeste",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-cesare-it",
    voice_name: "Cesare",
    gender: "Male",
    language: "it",
  },
  {
    model_id: "aura-2-cinzia-it",
    voice_name: "Cinzia",
    gender: "Female",
    language: "it",
  },
  {
    model_id: "aura-2-cora-en",
    voice_name: "Cora",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-cordelia-en",
    voice_name: "Cordelia",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-cornelia-nl",
    voice_name: "Cornelia",
    gender: "Female",
    language: "nl",
  },
  {
    model_id: "aura-2-daphne-nl",
    voice_name: "Daphne",
    gender: "Female",
    language: "nl",
  },
  {
    model_id: "aura-2-delia-en",
    voice_name: "Delia",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-demetra-it",
    voice_name: "Demetra",
    gender: "Female",
    language: "it",
  },
  {
    model_id: "aura-2-diana-es",
    voice_name: "Diana",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-dionisio-it",
    voice_name: "Dionisio",
    gender: "Male",
    language: "it",
  },
  {
    model_id: "aura-2-draco-en",
    voice_name: "Draco",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-ebisu-ja",
    voice_name: "Ebisu",
    gender: "Male",
    language: "ja",
  },
  {
    model_id: "aura-2-elara-de",
    voice_name: "Elara",
    gender: "Female",
    language: "de",
  },
  {
    model_id: "aura-2-electra-en",
    voice_name: "Electra",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-elio-it",
    voice_name: "Elio",
    gender: "Male",
    language: "it",
  },
  {
    model_id: "aura-2-estrella-es",
    voice_name: "Estrella",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-fabian-de",
    voice_name: "Fabian",
    gender: "Male",
    language: "de",
  },
  {
    model_id: "aura-2-flavio-it",
    voice_name: "Flavio",
    gender: "Male",
    language: "it",
  },
  {
    model_id: "aura-2-fujin-ja",
    voice_name: "Fujin",
    gender: "Male",
    language: "ja",
  },
  {
    model_id: "aura-2-gloria-es",
    voice_name: "Gloria",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-harmonia-en",
    voice_name: "Harmonia",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-hector-fr",
    voice_name: "Hector",
    gender: "Male",
    language: "fr",
  },
  {
    model_id: "aura-2-helena-en",
    voice_name: "Helena",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-hera-en",
    voice_name: "Hera",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-hermes-en",
    voice_name: "Hermes",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-hestia-nl",
    voice_name: "Hestia",
    gender: "Female",
    language: "nl",
  },
  {
    model_id: "aura-2-hyperion-en",
    voice_name: "Hyperion",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-iris-en",
    voice_name: "Iris",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-izanami-ja",
    voice_name: "Izanami",
    gender: "Female",
    language: "ja",
  },
  {
    model_id: "aura-2-janus-en",
    voice_name: "Janus",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-javier-es",
    voice_name: "Javier",
    gender: "Male",
    language: "es",
  },
  {
    model_id: "aura-2-julius-de",
    voice_name: "Julius",
    gender: "Male",
    language: "de",
  },
  {
    model_id: "aura-2-juno-en",
    voice_name: "Juno",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-jupiter-en",
    voice_name: "Jupiter",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-kara-de",
    voice_name: "Kara",
    gender: "Female",
    language: "de",
  },
  {
    model_id: "aura-2-lara-de",
    voice_name: "Lara",
    gender: "Female",
    language: "de",
  },
  {
    model_id: "aura-2-lars-nl",
    voice_name: "Lars",
    gender: "Male",
    language: "nl",
  },
  {
    model_id: "aura-2-leda-nl",
    voice_name: "Leda",
    gender: "Female",
    language: "nl",
  },
  {
    model_id: "aura-2-livia-it",
    voice_name: "Livia",
    gender: "Female",
    language: "it",
  },
  {
    model_id: "aura-2-luciano-es",
    voice_name: "Luciano",
    gender: "Male",
    language: "es",
  },
  {
    model_id: "aura-2-luna-en",
    voice_name: "Luna",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-maia-it",
    voice_name: "Maia",
    gender: "Female",
    language: "it",
  },
  {
    model_id: "aura-2-mars-en",
    voice_name: "Mars",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-melia-it",
    voice_name: "Melia",
    gender: "Female",
    language: "it",
  },
  {
    model_id: "aura-2-minerva-en",
    voice_name: "Minerva",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-neptune-en",
    voice_name: "Neptune",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-nestor-es",
    voice_name: "Nestor",
    gender: "Male",
    language: "es",
  },
  {
    model_id: "aura-2-odysseus-en",
    voice_name: "Odysseus",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-olivia-es",
    voice_name: "Olivia",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-ophelia-en",
    voice_name: "Ophelia",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-orion-en",
    voice_name: "Orion",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-orpheus-en",
    voice_name: "Orpheus",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-pandora-en",
    voice_name: "Pandora",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-phoebe-en",
    voice_name: "Phoebe",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-pluto-en",
    voice_name: "Pluto",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-rhea-nl",
    voice_name: "Rhea",
    gender: "Female",
    language: "nl",
  },
  {
    model_id: "aura-2-roman-nl",
    voice_name: "Roman",
    gender: "Male",
    language: "nl",
  },
  {
    model_id: "aura-2-sander-nl",
    voice_name: "Sander",
    gender: "Male",
    language: "nl",
  },
  {
    model_id: "aura-2-saturn-en",
    voice_name: "Saturn",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-2-selena-es",
    voice_name: "Selena",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-selene-en",
    voice_name: "Selene",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-silvia-es",
    voice_name: "Silvia",
    gender: "Female",
    language: "es",
  },
  {
    model_id: "aura-2-sirio-es",
    voice_name: "Sirio",
    gender: "Male",
    language: "es",
  },
  {
    model_id: "aura-2-thalia-en",
    voice_name: "Thalia",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-theia-en",
    voice_name: "Theia",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-uzume-ja",
    voice_name: "Uzume",
    gender: "Female",
    language: "ja",
  },
  {
    model_id: "aura-2-valerio-es",
    voice_name: "Valerio",
    gender: "Male",
    language: "es",
  },
  {
    model_id: "aura-2-vesta-en",
    voice_name: "Vesta",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-2-viktoria-de",
    voice_name: "Viktoria",
    gender: "Female",
    language: "de",
  },
  {
    model_id: "aura-2-zeus-en",
    voice_name: "Zeus",
    gender: "Male",
    language: "en",
  },

  {
    model_id: "aura-angus-en",
    voice_name: "Angus",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-arcas-en",
    voice_name: "Arcas",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-asteria-en",
    voice_name: "Asteria",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-athena-en",
    voice_name: "Athena",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-helios-en",
    voice_name: "Helios",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-hera-en",
    voice_name: "Hera",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-luna-en",
    voice_name: "Luna",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-orion-en",
    voice_name: "Orion",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-orpheus-en",
    voice_name: "Orpheus",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-perseus-en",
    voice_name: "Perseus",
    gender: "Male",
    language: "en",
  },
  {
    model_id: "aura-stella-en",
    voice_name: "Stella",
    gender: "Female",
    language: "en",
  },
  {
    model_id: "aura-zeus-en",
    voice_name: "Zeus",
    gender: "Male",
    language: "en",
  },
];

const STT_TTS_VOICES = STT_TTS_VOICES_DATA.map((v) => ({
  label: v.voice_name,
  value: v.voice_name,
  avatar:
    v.gender === "Male"
      ? "https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png"
      : "https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/female/45.png",
}));

const VOICE_OPTIONS = REAL_TIME_VOICES;

const MAX_CONCURRENT_CALLS_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  label: (i + 1).toString(),
  value: (i + 1).toString(),
}));

const CALL_RECORDING_OPTIONS = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

const BACKGROUND_AUDIO_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Office ambience", value: "office_ambience" },
];

const initialTelephonyFormData = {
  phone_number: [],
  inbound_enabled: true,
  outbound_enabled: false,
  primary_phone_number: null,
  transport_type: "PSTN",
  max_concurrent_calls: 5,
  call_timeout: 30,
  call_recording: true,
  max_inbound_ring_duration: 30,
};

const TELEPHONY_FIELDS = Object.keys(initialTelephonyFormData);
const EMPTY_FUNCTION_ROW = {
  endpoint: "",
  functionName: "",
  key: "",
  headers: [],
};
const initialLifecycleState = {
  id: null,
  retryAttempts: "",
  retryDelay: "",
  forwardKeys: { default: [] },
  endCallKeys: { default: [] },
  forwardTo: "Phone Number",
  phoneNumbers: [""],
  continueRecording: false,
  apiKeys: [{ value: "", enabled: true, isNew: true }],
  uniDirectionalFunctions: [{ ...EMPTY_FUNCTION_ROW }],
  biDirectionalFunctions: [{ ...EMPTY_FUNCTION_ROW }],
  withSystem: false,
  withApi: false,
};

const hasFilledFunction = (list = []) =>
  list.some(
    (fn) =>
      (fn?.endpoint && fn.endpoint.trim()) ||
      (fn?.functionName && fn.functionName.trim()) ||
      (fn?.key && fn.key.trim()),
  );

const getGenderForVoice = (voice) => {
  if (VOICE_GENDER_MAP.Female?.includes(voice)) return "Female";
  const sttVoice = STT_TTS_VOICES_DATA.find((v) => v.model_id === voice);
  if (sttVoice) return sttVoice.gender;
  return "Male";
};

const VoiceAiBasics = () => {
  const { agent_app } = useParams();
  const [isBuyNumberOpen, setIsBuyNumberOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = agent_app ? atobAgentId(agent_app) : null;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      agentName: "",
      agent_name: "",
      agentType: "Conversation",
      agentStatus: "Draft",
      language: "English",
      voiceGender: "Male",
      voiceType: "Real Time",
      voice: "Zephyr",
      backgroundAudio: "none",
      selectedAgent: agentId,
      geminiModel: "gemini-2.5-flash-native-audio-preview-12-2025",
      timezone: "",
      startTime: "",
      endTime: "",
      weekendSupport: false,
      activeDays: [],
      ...initialTelephonyFormData,
    },
  });

  useEffect(() => {
    if (agentId) {
      setValue("selectedAgent", agentId);
    }
  }, [agentId, setValue]);

  const [currentVersionId, setCurrentVersionId] = useState(null);
  const [currentVersionNumber, setCurrentVersionNumber] = useState(null);

  const watchedSelectedAgent = watch("selectedAgent");
  const watchedVoiceGender = watch("voiceGender");
  const watchedVoiceType = watch("voiceType");

  const filteredVoiceOptions = useMemo(() => {
    let options = [];

    if (watchedVoiceType === "STT-TTS") {
      let filteredData = STT_TTS_VOICES_DATA;
      if (watchedVoiceGender) {
        filteredData = filteredData.filter(
          (d) => d.gender === watchedVoiceGender,
        );
      }

      // Deduplicate by voice_name
      const uniqueVoices = new Map();
      filteredData.forEach((v) => {
        if (!uniqueVoices.has(v.voice_name)) {
          uniqueVoices.set(v.voice_name, v);
        }
      });

      options = Array.from(uniqueVoices.values()).map((v) => ({
        label: v.voice_name,
        value: v.model_id,
        avatar:
          v.gender === "Male"
            ? "https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png"
            : "https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/female/45.png",
      }));
    } else {
      // Real Time
      if (watchedVoiceGender) {
        const allowed = VOICE_GENDER_MAP[watchedVoiceGender] || [];
        options = REAL_TIME_VOICES.filter((v) => allowed.includes(v.value));
      } else {
        options = REAL_TIME_VOICES;
      }
    }

    return options;
  }, [watchedVoiceGender, watchedVoiceType]);

  // Autopopulate logic
  useEffect(() => {
    const currentVoice = getValues("voice");
    let isValid = false;

    // Check if current voice is valid for current type & gender
    if (watchedVoiceType === "STT-TTS") {
      const voiceData = STT_TTS_VOICES_DATA.find(
        (d) => d.model_id === currentVoice,
      );
      if (
        voiceData &&
        (!watchedVoiceGender || voiceData.gender === watchedVoiceGender)
      ) {
        isValid = true;
      }
    } else {
      const allowed = watchedVoiceGender
        ? VOICE_GENDER_MAP[watchedVoiceGender] || []
        : REAL_TIME_VOICES.map((v) => v.value);
      if (allowed.includes(currentVoice)) {
        isValid = true;
      }
    }

    // If not valid, pick the first available option
    if (!isValid && filteredVoiceOptions.length > 0) {
      setValue("voice", filteredVoiceOptions[0].value);
    }
  }, [
    watchedVoiceType,
    watchedVoiceGender,
    filteredVoiceOptions,
    setValue,
    getValues,
  ]);

  const {
    data: versionsByAppDataRes,
    isLoading: isVersionsLoading,
    isPlaceholderData: isVersionsPlaceholder,
  } = useGetAgentVersionsByApp(watchedSelectedAgent);
  const { data: voiceAgentData } = useGetAgentById(agentId);

  const versionsByAppData = versionsByAppDataRes;

  useEffect(() => {
    if (watchedSelectedAgent && versionsByAppData?.length > 0) {
      const versionParam = searchParams.get("version");
      let latestVersion =
        versionsByAppData?.find((v) => v.status === "Active") ||
        versionsByAppData?.[0];

      if (versionParam) {
        const found = versionsByAppData.find(
          (v) => v.version_number === versionParam,
        );
        if (found) {
          latestVersion = found;
        }
      }

      setValue("voice", latestVersion.voice);
      setValue("voiceGender", getGenderForVoice(latestVersion.voice));
      setValue("language", latestVersion.language);
      setValue("backgroundAudio", latestVersion.background_audio || "none");
      setValue(
        "agentType",
        latestVersion.agent_type === "Inbound" ||
          latestVersion.agent_type === "Outbound"
          ? "Conversation"
          : latestVersion.agent_type,
      );
      setValue("agentStatus", latestVersion.status);
      setValue("geminiModel", latestVersion.gemini_model);
      setValue("timezone", latestVersion.timezone);
      setValue("startTime", latestVersion.start_time);
      setValue("endTime", latestVersion.end_time);
      setValue("agent_name", latestVersion.agent_name || "");
      setValue("weekendSupport", latestVersion.weekend_support ?? false);
      setValue("activeDays", latestVersion.active_days || []);

      // Determine voiceType based on voice if not present
      if (latestVersion.voice_type) {
        setValue("voiceType", latestVersion.voice_type);
      } else {
        const inSttTts = STT_TTS_VOICES_DATA.some(
          (v) => v.model_id === latestVersion.voice,
        );
        setValue("voiceType", inSttTts ? "STT-TTS" : "Real Time");
      }

      setCurrentVersionId(latestVersion.id);
      setCurrentVersionNumber(latestVersion.version_number);
    } else if (watchedSelectedAgent && versionsByAppData?.length === 0) {
      setCurrentVersionId(null);
      setCurrentVersionNumber(null);
      setValue("agentType", "Conversation");
      setValue("backgroundAudio", "none");
    }
  }, [watchedSelectedAgent, versionsByAppData, setValue, agentId]);

  const { mutate: updateVersion, isPending: isUpdatingVersion } =
    useUpdateAgentVersion();
  const { mutateAsync: createVersionAsync, isPending: isCreatingVersion } =
    useCreateAgentVersion();
  const { mutateAsync: cloneVersion, isPending: isCloning } =
    useCloneAgentVersion();
  const { data: versionsDataRes } = useGetAgentVersions(agentId);

  const versionsData = versionsDataRes;

  const versions = useMemo(() => {
    if (!versionsData?.length > 0) return [];
    return versionsData.map((v) => ({
      id: v.id,
      version: v.version_number,
      status: v.status,
      createdBy: v.created_by_name || "Unknown",
      createdBot: v.createdBot,
      createdDate: v.created_date,
      updated_at: v.updated_at,
      created_at: v.created_at,
      agent_name: v.agent_name,
      voice: v.voice,
      voiceType:
        v.voice_type ||
        (STT_TTS_VOICES_DATA.some((val) => val.model_id === v.voice)
          ? "STT-TTS"
          : "Real Time"),
      language: v.language,
      backgroundAudio: v.background_audio || "none",
      app: v.app,
      agentType: v.agent_type,
      geminiModel: v.gemini_model,
      timezone: v.timezone,
      startTime: v.start_time,
      endTime: v.end_time,
      weekendSupport: v.weekend_support ?? false,
      activeDays: v.active_days || [],
      Telephony_Settings_id: v.Telephony_Settings_id, // Ensure this is available
      life_cycle_id: v.life_cycle_id,
    }));
  }, [versionsData]);

  const handleViewVersion = (version) => {
    setValue("voice", version.voice);
    setValue("voiceGender", getGenderForVoice(version.voice));
    setValue("language", version.language);
    setValue("backgroundAudio", version.backgroundAudio || "none");
    setValue("agentType", version.agentType);
    setValue("agentStatus", version.status);
    setValue("geminiModel", version.geminiModel);
    setValue("timezone", version.timezone);
    setValue("startTime", version.startTime);
    setValue("endTime", version.endTime);
    setValue("agent_name", version.agent_name || "");
    setValue("weekendSupport", version.weekendSupport ?? false);
    setValue("activeDays", version.activeDays || []);

    // Set voiceType directly if available, else fallback
    if (version.voiceType) {
      setValue("voiceType", version.voiceType);
    } else {
      const inSttTts = STT_TTS_VOICES_DATA.some(
        (v) => v.model_id === version.voice,
      );
      setValue("voiceType", inSttTts ? "STT-TTS" : "Real Time");
    }

    setCurrentVersionId(version.id);
    setCurrentVersionNumber(version.version);
    setSearchParams({ version: version.version });
  };

  const handleCreateVersion = async (
    currentAgentId = agentId,
    versionNum = null,
  ) => {
    if (!currentAgentId) {
      toaster.warning({
        title: "warning",
        description: "Please save agent first",
      });
      return;
    }

    let nextVersion = versionNum;
    if (!nextVersion) {
      if (versions && versions.length > 0) {
        const lastVer = versions[0].version;
        const parts = lastVer.replace("v", "").split(".");
        if (parts.length === 2) {
          nextVersion = `${parts[0]}.${parseInt(parts[1]) + 1}`;
        } else {
          nextVersion = `${versions.length + 1}.0`;
        }
      } else {
        nextVersion = "1.0";
      }
    }

    const allData = getValues();
    const nextLifecycleErrors = validateLifecycle(lifecycleState);
    setLifecycleErrors(nextLifecycleErrors);
    if (Object.keys(nextLifecycleErrors).length > 0) {
      toaster.error({
        title: "Validation error",
        description:
          "Please fix Call Settings fields before saving a new version.",
      });
      return;
    }

    const telephonyData = {};
    TELEPHONY_FIELDS.forEach((key) => {
      telephonyData[key] = allData[key];
    });
    const lifecyclePayload = buildLifecyclePayload(lifecycleState);

    try {
      await cloneVersion({
        app: currentAgentId,
        version_number: nextVersion,
        source_version_id: currentVersionId,
        agent_name: allData.agent_name,
        voice: allData.voice,
        voice_type: allData.voiceType,
        language: allData.language,
        background_audio: allData.backgroundAudio,
        agent_type: allData.agentType,
        status: "Draft",
        gemini_model: allData.geminiModel,
        timezone: allData.timezone,
        start_time: allData.startTime || null,
        end_time: allData.endTime || null,
        weekend_support: allData.weekendSupport ?? false,
        active_days: allData.activeDays || [],
        telephony_updates: telephonyData, // Pass telephony data to be cloned/updated
        lifecycle_updates: lifecyclePayload,
      });

      setSearchParams({ version: nextVersion });
      toaster.success({
        title: `Version ${nextVersion} Created`,
        description: "Version created successfully",
      });
    } catch (err) {
      toaster.error({
        title: "Error creating version",
        description: err.message,
      });
    }
  };

  // ------------------------------------------
  // TELEPHONY LOGIC
  // ------------------------------------------

  // const [availableNumbers, setAvailableNumbers] = useState([]);
  // const { data: getnumbers } = useGetNumbers();
  // const { mutateAsync: buyNumbers } = useBuyNumbers();
  // const { data: getavailableNumbers } = useGetAvailableNumbers();
  const [showAvailablePicker] = useState(true);
  // const [buyableNumbers, setBuyableNumbers] = useState([]);
  // const [showBuyPicker, setShowBuyPicker] = useState(false);
  const [showPhones, setShowPhones] = useState(false);

  const telephonyFormData = watch();
  console.log("telephonyFormData", telephonyFormData);
  // useEffect(() => {
  //   setBuyableNumbers(getnumbers?.result, []);
  // }, [buyNumbers, getnumbers]);
  // useEffect(() => {
  //   setAvailableNumbers(getavailableNumbers?.result || []);
  // }, [buyNumbers, getavailableNumbers]);

  // Find Telephony ID from active version
  const activeVersion = useMemo(() => {
    if (!versionsDataRes?.length) return null;
    return versionsDataRes.find((v) => v.id === currentVersionId);
  }, [versionsDataRes, currentVersionId]);

  console.log("activeVersion", activeVersion);

  const telephonyId = activeVersion?.Telephony_Settings_id;
  const lifeCycleId = activeVersion?.life_cycle_id;

  const {
    data: telephonyData,
    isLoading: telephonyLoading,
    isPlaceholderData: telephonyPlaceholder,
  } = useGetTelephonySettings(telephonyId);
  const {
    data: lifeCycleData,
    isLoading: lifeCycleLoading,
    isPlaceholderData: lifeCyclePlaceholder,
  } = useGetScalingRouting(currentVersionId);
  const { data: mobileNumbersDataRes } = useGetMobileNumbers();
  const mobileNumbersData = mobileNumbersDataRes?.numbers || [];
  console.log("mobileNumbersData", mobileNumbersData);
  console.log("telephonyData2323", {
    telephonyData,
    telephonyId,
    activeVersion,
  });
  const { mutate: updateTelephony, isPending: isUpdatingTelephony } =
    useUpdateTelephonySettings();
  const { mutateAsync: createTelephony, isPending: isCreatingTelephony } =
    useCreateTelephonySettings();
  const { mutateAsync: createRouting, isPending: isCreatingRouting } =
    useCreateRoutingScaling();
  const { mutateAsync: updateRouting, isPending: isUpdatingRouting } =
    useUpdateRoutingScaling();
  const { mutateAsync: updateAgentVersionAsync } = useUpdateAgentVersion();

  const {
    mutate: updateVersionStatus,
    isPending: isUpdatingStatus,
    variables: updatingVariables,
  } = useUpdateAgentVersionStatus();

  const [optimisticStatuses, setOptimisticStatuses] = useState({});
  const [lifecycleState, setLifecycleState] = useState(initialLifecycleState);
  const [lifecycleErrors, setLifecycleErrors] = useState({});

  useEffect(() => {
    if (telephonyData) {
      console.log("telephonyData9999", telephonyData);
      const data = telephonyData?.data || telephonyData;
      TELEPHONY_FIELDS.forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          setValue(key, data[key]);
        }
      });
    } else {
      // If no telephony data but we have an active version, reset to defaults
      if (activeVersion && !telephonyId) {
        TELEPHONY_FIELDS.forEach((key) => {
          setValue(key, initialTelephonyFormData[key]);
        });
      }
    }
  }, [telephonyData, setValue, activeVersion, telephonyId]);

  useEffect(() => {
    if (!lifeCycleData?.length || !lifeCycleId) {
      setLifecycleState(initialLifecycleState);
      return;
    }

    const payload = lifeCycleData.find((item) => item.id === lifeCycleId);
    if (!payload) {
      setLifecycleState(initialLifecycleState);
      return;
    }

    const uniDirectionalFunctions =
      payload.uni_directional_calls?.length > 0
        ? payload.uni_directional_calls
        : [{ ...EMPTY_FUNCTION_ROW }];
    const biDirectionalFunctions =
      payload.bi_directional_calls?.length > 0
        ? payload.bi_directional_calls
        : [{ ...EMPTY_FUNCTION_ROW }];

    setLifecycleState({
      id: payload.id,
      retryAttempts: payload.retry_attempts ?? "",
      retryDelay: payload.retry_delay ?? "",
      forwardKeys: payload.forward_keys || { default: [] },
      endCallKeys: payload.end_call_keys || { default: [] },
      forwardTo: payload.forward_to || "Phone Number",
      phoneNumbers:
        Array.isArray(payload.forward_data) && payload.forward_data.length > 0
          ? payload.forward_data
          : [""],
      continueRecording: payload.recording ?? false,
      apiKeys:
        Array.isArray(payload.allowed_api_keys) &&
        payload.allowed_api_keys.length > 0
          ? payload.allowed_api_keys
              .map((keyItem) => ({
                value:
                  typeof keyItem === "string" ? keyItem : keyItem?.value || "",
                enabled:
                  typeof keyItem === "string"
                    ? true
                    : (keyItem?.enabled ?? true),
                isNew: false,
              }))
              .filter((keyItem) => keyItem.value)
          : [{ value: "", enabled: true, isNew: true }],
      uniDirectionalFunctions,
      biDirectionalFunctions,
      withSystem:
        hasFilledFunction(uniDirectionalFunctions) ||
        hasFilledFunction(biDirectionalFunctions),
      withApi:
        hasFilledFunction(uniDirectionalFunctions) ||
        hasFilledFunction(biDirectionalFunctions),
    });
  }, [lifeCycleData, lifeCycleId]);

  const validateLifecycle = (state) => {
    const validationErrors = {};

    if (state.retryAttempts < 0 || state.retryAttempts > 60) {
      validationErrors.retryAttempts =
        "Retry attempts must be between 0 and 60";
    }

    if (state.retryDelay < 0 || state.retryDelay > 60) {
      validationErrors.retryDelay = "Retry delay must be between 0 and 60";
    }

    if (state.retryAttempts > 0 && state.retryDelay <= 0) {
      validationErrors.retryDelay =
        "Retry delay required when retries are enabled";
    }

    if (!state.forwardTo) {
      validationErrors.forwardTo = "Select where calls should be forwarded";
    }

    if (state.withSystem) {
      (state.uniDirectionalFunctions || []).forEach((fn, index) => {
        if (fn.functionName && fn.functionName.trim()) {
          if (!fn.endpoint || !fn.endpoint.trim()) {
            validationErrors[`uniDirectional_${index}_endpoint`] =
              "Endpoint is required";
          } else {
            try {
              new URL(fn.endpoint);
            } catch {
              validationErrors[`uniDirectional_${index}_endpoint`] =
                "Invalid URL";
            }
          }

          if (!fn.key || !fn.key.trim()) {
            validationErrors[`uniDirectional_${index}_key`] = "Key is required";
          }
        }
      });

      (state.biDirectionalFunctions || []).forEach((fn, index) => {
        if (fn.functionName && fn.functionName.trim()) {
          if (!fn.endpoint || !fn.endpoint.trim()) {
            validationErrors[`biDirectional_${index}_endpoint`] =
              "Endpoint is required";
          } else {
            try {
              new URL(fn.endpoint);
            } catch {
              validationErrors[`biDirectional_${index}_endpoint`] =
                "Invalid URL";
            }
          }

          if (!fn.key || !fn.key.trim()) {
            validationErrors[`biDirectional_${index}_key`] = "Key is required";
          }
        }
      });
    }

    return validationErrors;
  };

  useEffect(() => {
    setLifecycleErrors(validateLifecycle(lifecycleState));
  }, [lifecycleState]);

  const buildLifecyclePayload = (state) => ({
    id: state.id,
    retry_attempts: state.retryAttempts || 0,
    retry_delay: state.retryDelay || 0,
    forward_keys: state.forwardKeys,
    end_call_keys: state.endCallKeys,
    forward_to: state.forwardTo,
    forward_data: (state.phoneNumbers || []).filter(
      (num) => num && num.trim() !== "",
    ),
    recording: state.continueRecording,
    forward_condition: [],
    trigger_mode: [],
    allowed_api_keys: (state.apiKeys || [])
      .filter((keyItem) => keyItem.value && keyItem.value.trim() !== "")
      .map((keyItem) => ({
        value: keyItem.value,
        enabled: keyItem.enabled,
      })),
    uni_directional_calls: state.withSystem
      ? state.uniDirectionalFunctions
      : [],
    bi_directional_calls: state.withSystem ? state.biDirectionalFunctions : [],
  });

  const handleUnifiedSave = async (data) => {
    const nextLifecycleErrors = validateLifecycle(lifecycleState);
    setLifecycleErrors(nextLifecycleErrors);
    if (Object.keys(nextLifecycleErrors).length > 0) {
      toaster.error({
        title: "Validation error",
        description: "Please fix Call settings fields before saving.",
      });
      return;
    }

    let targetVersionId = currentVersionId;
    let targetVersion = activeVersion;

    // --- Basics Save ---
    if (targetVersionId) {
      const versionPayload = {
        app: agentId,
        version_number: currentVersionNumber,
        agent_name: data.agent_name,
        voice: data.voice,
        voice_type: data.voiceType,
        language: data.language,
        background_audio: data.backgroundAudio,
        agent_type: data.agentType,
        status: data.agentStatus,
        gemini_model: data.geminiModel,
        timezone: data.timezone,
        start_time: data.startTime || null,
        end_time: data.endTime || null,
        weekend_support: data.weekendSupport ?? false,
        active_days: data.activeDays || [],
      };
      updateVersion(
        { id: targetVersionId, data: versionPayload },
        {
          onSuccess: () => {
            toaster.success({
              title: "Agent Updated",
              description: "Version updated successfully",
            });
          },
          onError: (err) => {
            toaster.error({
              title: "Error updating version",
              description: err.message,
            });
          },
        },
      );
    } else {
      const versionPayload = {
        version_number: "1.0",
        agent_name: data.agent_name,
        voice: data.voice,
        voice_type: data.voiceType,
        language: data.language,
        background_audio: data.backgroundAudio,
        agent_type: data.agentType,
        status: data.agentStatus,
        app: agentId,
        gemini_model: data.geminiModel,
        timezone: data.timezone,
        start_time: data.startTime || null,
        end_time: data.endTime || null,
        active_days: data.activeDays || [],
      };

      try {
        const createResult = await createVersionAsync(versionPayload);
        const newVersion = createResult?.data || createResult;
        targetVersionId = newVersion?.id;
        targetVersion = newVersion || null;
        setCurrentVersionId(newVersion?.id || null);
        setCurrentVersionNumber(newVersion?.version_number || "1.0");
        if (newVersion?.version_number) {
          setSearchParams({ version: newVersion.version_number });
        }
        toaster.success({
          title: "Agent Created",
          description: "Initial Version created successfully",
        });
      } catch (err) {
        toaster.error({
          title: "Error creating version",
          description: err.message,
        });
        return;
      }
    }

    // --- Telephony Save ---
    // Extract telephony data
    const telephonyPayload = {};
    TELEPHONY_FIELDS.forEach((key) => {
      telephonyPayload[key] = data[key];
    });

    if (telephonyFormData.inbound_enabled) {
      telephonyPayload.inbound_enabled = true;
      telephonyPayload.outbound_enabled = false;
    } else if (telephonyFormData.outbound_enabled) {
      telephonyPayload.inbound_enabled = false;
      telephonyPayload.outbound_enabled = true;
    }

    console.log("telephonyPayload", telephonyPayload);

    const targetTelephonyId =
      targetVersion?.Telephony_Settings_id || telephonyId;

    if (targetTelephonyId) {
      updateTelephony(
        { id: targetTelephonyId, ...telephonyPayload },
        {
          onSuccess: async () => {
            toaster.success({
              title: "Success",
              description: "Telephony settings updated successfully.",
            });
          },
          onError: (error) => {
            console.error(error);
            toaster.error({
              title: "Error",
              description: "Failed to update telephony settings.",
            });
          },
        },
      );
    } else if (targetVersionId) {
      if (
        !telephonyPayload.phone_number ||
        telephonyPayload.phone_number.length === 0
      ) {
        toaster.error({
          title: "Telephony Validation",
          description:
            "At least one phone number is required to create telephony settings.",
        });
        return;
      }
      createTelephony(telephonyPayload, {
        onSuccess: async (res) => {
          const newTelephonyId = res?.data?.id;
          if (newTelephonyId) {
            await updateAgentVersionAsync({
              id: targetVersionId,
              data: { Telephony_Settings_id: newTelephonyId },
            });
            toaster.success({
              title: "Success",
              description: "Telephony settings created and linked.",
            });
          }
        },
        onError: (error) => {
          console.error(error);
          toaster.error({
            title: "Error",
            description: "Failed to create telephony settings.",
          });
        },
      });
    }

    // --- Lifecycle Save ---
    const lifecyclePayload = buildLifecyclePayload(lifecycleState);
    const targetLifeCycleId = targetVersion?.life_cycle_id || lifeCycleId;

    try {
      if (targetLifeCycleId) {
        await updateRouting({
          ...lifecyclePayload,
          id: targetLifeCycleId,
        });
      } else if (targetVersionId) {
        const createLifecycleResult = await createRouting(lifecyclePayload);
        const createdLifecycle =
          createLifecycleResult?.data || createLifecycleResult;
        if (createdLifecycle?.id) {
          await updateAgentVersionAsync({
            id: targetVersionId,
            data: { life_cycle_id: createdLifecycle.id },
          });
        }
      }
    } catch (error) {
      toaster.error({
        title: "Call Settings Save Error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save Call settings.",
      });
    }
  };

  console.log("telephonyData", telephonyData, telephonyFormData);

  const columns = useMemo(
    () => [
      {
        title: "Version",
        accessor_key: "version",
        render: (value) => <>v{value}</>,
      },
      {
        title: "Voice Type",
        accessor_key: "voiceType",
      },
      {
        title: "Agent Type",
        accessor_key: "agentType",
      },
      {
        title: "Status",
        accessor_key: "status",
        render: (value, row) => {
          const currentStatus = optimisticStatuses[row.id] || value;
          let colorScheme = "gray";
          let bg = "gray.700";
          let color = "gray.300";
          if (currentStatus === "Active") {
            colorScheme = "green";
            bg = "green.900";
            color = "green.300";
          } else if (currentStatus === "Testing") {
            colorScheme = "yellow";
            bg = "yellow.900";
            color = "yellow.300";
          }
          return (
            <Badge
              colorScheme={colorScheme}
              bg={bg}
              color={color}
              px={2}
              py={1}
              borderRadius="md"
              textTransform="capitalize"
            >
              {currentStatus}
            </Badge>
          );
        },
      },
      {
        title: "Created By",
        accessor_key: "createdBy",
      },

      {
        title: "Created Date",
        accessor_key: "created_at",
        render: (value) => new Date(value).toLocaleString(),
      },
      {
        title: "Updated At",
        accessor_key: "updated_at",
        render: (value) => new Date(value).toLocaleString(),
      },
      {
        title: "Actions",
        accessor_key: "actions",
        render: (value, row) => {
          const currentStatus = optimisticStatuses[row.id] || row.status;
          return (
            <HStack gap={2}>
              <HStack
                gap={1}
                bg="blackAlpha.400"
                p={1}
                borderRadius="lg"
                w="fit-content"
              >
                {["Draft", "Active", "Paused"].map((status) => (
                  <Button
                    key={status}
                    size="xs"
                    bg={
                      currentStatus === status
                        ? "var(--bg-success-gradient2)"
                        : "transparent"
                    }
                    color={currentStatus === status ? "white" : "gray.400"}
                    onClick={() => {
                      if (status === "Active") {
                        const previousActive = versions.find(
                          (v) =>
                            v.id !== row.id &&
                            (optimisticStatuses[v.id] || v.status) === "Active",
                        );

                        if (previousActive) {
                          setOptimisticStatuses((prev) => ({
                            ...prev,
                            [previousActive.id]: "Paused",
                          }));

                          updateVersionStatus({
                            id: previousActive.id,
                            status: "Paused",
                            version_number: previousActive.version,
                            app_id: previousActive.app,
                          });
                        }
                      }

                      setOptimisticStatuses((prev) => ({
                        ...prev,
                        [row.id]: status,
                      }));
                      updateVersionStatus(
                        {
                          id: row.id,
                          status,
                          version_number: row.version,
                          app_id: row.app,
                        },
                        {
                          onSuccess: () => {
                            toaster.success({
                              title: "Status Updated",
                              description: `Agent status updated to ${status}`,
                            });
                          },
                          onError: (err) => {
                            setOptimisticStatuses((prev) => {
                              const newMap = { ...prev };
                              delete newMap[row.id];
                              return newMap;
                            });
                            toaster.error({
                              title: "Error updating status",
                              description: err.message,
                            });
                          },
                        },
                      );
                    }}
                    _hover={{
                      bg:
                        currentStatus === status
                          ? "var(--bg-success-gradient2)"
                          : "whiteAlpha.100",
                    }}
                    borderRadius="12px"
                    border="none"
                    isLoading={
                      isUpdatingStatus &&
                      updatingVariables?.id === row.id &&
                      updatingVariables?.status === status
                    }
                  >
                    {status}
                  </Button>
                ))}
              </HStack>
              <Button
                size="xs"
                variant="outline"
                color="white"
                borderColor="gray.600"
                _hover={{ bg: "whiteAlpha.200" }}
                borderRadius={"12px"}
                onClick={() => handleViewVersion(row)}
              >
                View
              </Button>

              <IconButton
                aria-label="Refresh"
                icon={<RefreshCw size={14} />}
                size="xs"
                variant="ghost"
                color="gray.400"
              />
            </HStack>
          );
        },
      },
    ],
    [
      isUpdatingStatus,
      updatingVariables,
      updateVersionStatus,
      optimisticStatuses,
      versions,
    ],
  );

  console.log("versions1212", versions);

  const isUpdateLoading =
    isUpdatingVersion ||
    isCreatingVersion ||
    isUpdatingTelephony ||
    isCreatingTelephony ||
    isCreatingRouting ||
    isUpdatingRouting;

  return (
    <Flex direction={"column"} height={"full"}>
      {/* SVG Gradient Definition for Icons */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient
            id="green-stroke-gradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#94f219" />
            <stop offset="100%" stopColor="#5a9310" />
          </linearGradient>
        </defs>
      </svg>
      <VoiceAiHeader
        onSaveAsNewVersion={() => handleCreateVersion()}
        isSaveLoading={isCloning}
        isSaveAsNewVersionDisabled={!versions || versions.length === 0}
      />

      <Box
        flex={"0.99"}
        display={"flex"}
        flexDirection={"column"}
        p={4}
        bgColor={"droidalBlack.400"}
        borderRadius={"xl"}
        className="text-white flex flex-col gap-4 overflow-auto"
      >
        {/* Agent Configuration Container */}
        <Box
          className="bg-droidal-black-300 relative animated-gradient-card"
          p={4}
          borderRadius="xl"
          id="agent-configuration"
          zIndex={"1000"}
        >
          <Grid
            templateColumns={{
              base: "1fr",
              "2xl": "2.5fr 1fr",
              "3xl": "2.2fr 1fr",
            }}
            gap={{ base: 4, "3xl": 6 }}
          >
            {/* LEFT COLUMN: AGENT CONFIGURATION */}
            <GridItem>
              <HStack mb={2} gap={3}>
                <span className="green-gradient-icon">
                  <Settings size={24} strokeWidth={"2"} />
                </span>
                <Text
                  fontSize="md"
                  fontWeight="semibold"
                  letterSpacing="wide"
                  mb={0}
                >
                  Agent Configuration -{" "}
                  <Span color="#90a6c6">{voiceAgentData?.app_name}</Span>
                  {(isVersionsPlaceholder || isVersionsLoading) && (
                    <Spinner size="xs" ml={2} />
                  )}
                </Text>
              </HStack>

              <VStack align="stretch" gapX={4}>
                <HStack align="start" gapX={4}>
                  <Box
                    borderRadius="xl"
                    overflow="hidden"
                    boxSize="100px"
                    border="2px solid"
                    borderColor="whiteAlpha.200"
                    flexShrink={0}
                  >
                    <Image
                      src={avatarMap[watch("voice")] || avatarMap["Zephyr"]}
                      alt="Agent Avatar"
                      objectFit="cover"
                      w="100%"
                      h="100%"
                    />
                  </Box>
                  <VStack align="stretch" flex={1} gapX={4}>
                    <SimpleGrid columns={4} gap={4}>
                      <Controller
                        name="agent_name"
                        control={control}
                        render={({ field }) => (
                          <CustomInput
                            label={"Agent Name"}
                            placeholder={"Enter Agent Name"}
                            value={field.value}
                            onChange={field.onChange}
                            invalid={!!errors.agent_name}
                            showError={!!errors.agent_name}
                            errorMessage={errors.agent_name?.message}
                            size={{
                              base: "xs",
                              "3xl": "sm",
                              "4xl": "md",
                            }}
                            required={true}
                            labelProps={{
                              color: "gray.400",
                              fontSize: "xs",
                            }}
                          />
                        )}
                        rules={{
                          required: "Agent name is required",
                        }}
                      />
                      <Box>
                        <Text
                          mb={4}
                          color="gray.400"
                          fontSize="xs"
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                        >
                          Voice Type
                        </Text>
                        <Controller
                          name="voiceType"
                          control={control}
                          render={({ field }) => (
                            <RadioGroup.Root
                              value={field.value}
                              onValueChange={(e) => field.onChange(e.value)}
                              orientation="horizontal"
                              size={{
                                base: "sm",
                                "3xl": "sm",
                                "4xl": "md",
                              }}
                            >
                              <HStack gap={"1"}>
                                <RadioGroup.Item value="Real Time">
                                  <RadioGroup.ItemHiddenInput />
                                  <RadioGroup.ItemIndicator
                                    _checked={{
                                      bgImage:
                                        "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                      border: "none !important",
                                    }}
                                    borderColor="#2f4d78"
                                    bgColor={"black"}
                                  />
                                  <RadioGroup.ItemText
                                    letterSpacing={"wider"}
                                    fontWeight={"light"}
                                    color="white"
                                    fontSize="xs"
                                  >
                                    Real Time
                                  </RadioGroup.ItemText>
                                </RadioGroup.Item>
                                <RadioGroup.Item value="STT-TTS">
                                  <RadioGroup.ItemHiddenInput />
                                  <RadioGroup.ItemIndicator
                                    _checked={{
                                      bgImage:
                                        "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                      border: "none !important",
                                    }}
                                    borderColor="#2f4d78"
                                    bgColor={"black"}
                                  />
                                  <RadioGroup.ItemText
                                    letterSpacing={"wider"}
                                    fontWeight={"light"}
                                    color="white"
                                    fontSize="xs"
                                  >
                                    STT-TTS
                                  </RadioGroup.ItemText>
                                </RadioGroup.Item>
                              </HStack>
                            </RadioGroup.Root>
                          )}
                        />
                      </Box>
                      <Box>
                        <Text
                          mb={2}
                          color="gray.400"
                          fontSize="xs"
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                        >
                          Voice Gender
                        </Text>
                        <Controller
                          name="voiceGender"
                          control={control}
                          render={({ field }) => {
                            console.log("field.value121", field.value);
                            return (
                              <CustomSelect
                                value={field.value ? [field.value] : []}
                                onValueChange={(e) => field.onChange(e[0])}
                                options={VOICE_GENDER_OPTIONS}
                                placeholder="Select Gender"
                                w="100%"
                                size={{
                                  base: "xs",
                                  "3xl": "sm",
                                  "4xl": "md",
                                }}
                                css={{
                                  "& button": {
                                    borderRadius: "4px !important",
                                    borderColor: "#2f4d78",
                                  },
                                }}
                              />
                            );
                          }}
                        />
                      </Box>
                      <Box>
                        <Text
                          mb={2}
                          color="gray.400"
                          fontSize="xs"
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                        >
                          Voice
                        </Text>
                        <Controller
                          name="voice"
                          control={control}
                          render={({ field }) => {
                            console.log(
                              "field.value121",
                              field.value,
                              filteredVoiceOptions,
                            );
                            return (
                              <CustomSelect
                                value={field.value ? [field.value] : []}
                                onValueChange={(e) => field.onChange(e[0])}
                                options={filteredVoiceOptions}
                                placeholder="Select Voice"
                                w="100%"
                                size={{
                                  base: "xs",
                                  "3xl": "sm",
                                  "4xl": "md",
                                }}
                                css={{
                                  "& button": {
                                    borderRadius: "4px !important",
                                    borderColor: "#2f4d78",
                                  },
                                }}
                              />
                            );
                          }}
                        />
                      </Box>
                    </SimpleGrid>
                    <HStack gap={4} flexWrap={"nowrap"}>
                      <Box
                        w={{
                          "2xl": "105px",
                          "3xl": "150px",
                        }}
                      >
                        <Text
                          mb={1}
                          color="gray.400"
                          fontSize="xs"
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                        >
                          Background Audio
                        </Text>
                        <Controller
                          name="backgroundAudio"
                          control={control}
                          render={({ field }) => (
                            <CustomSelect
                              value={field.value ? [field.value] : []}
                              onValueChange={(v) => field.onChange(v[0])}
                              options={BACKGROUND_AUDIO_OPTIONS}
                              placeholder="Select Background Audio"
                              w="100%"
                              size={{
                                base: "xs",
                                "3xl": "sm",
                                "4xl": "md",
                              }}
                              css={{
                                "& button": {
                                  borderRadius: "4px !important",
                                  borderColor: "#2f4d78",
                                },
                              }}
                            />
                          )}
                        />
                      </Box>
                      <Box
                        w={{
                          "2xl": "105px",
                          "3xl": "150px",
                        }}
                      >
                        <Text
                          mb={1}
                          color="gray.400"
                          fontSize="xs"
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                        >
                          Language
                        </Text>
                        <Controller
                          name="language"
                          control={control}
                          render={({ field }) => (
                            <CustomSelect
                              value={field.value ? [field.value] : []}
                              onValueChange={(v) => field.onChange(v[0])}
                              options={LANGUAGE_OPTIONS}
                              placeholder="Select Language"
                              w="100%"
                              size={{
                                base: "xs",
                                "3xl": "sm",
                                "4xl": "md",
                              }}
                              css={{
                                "& button": {
                                  borderRadius: "4px !important",
                                  borderColor: "#2f4d78",
                                },
                              }}
                            />
                          )}
                        />
                      </Box>

                      <Box>
                        <HStack gap={4} align="center" flexWrap="nowrap">
                          <Box>
                            <Text
                              mb={1}
                              color="gray.400"
                              fontSize="xs"
                              letterSpacing={"wider"}
                              fontWeight={"light"}
                            >
                              Call Direction{" "}
                              <Text as="span" color="red.500">
                                *
                              </Text>
                            </Text>
                            <RadioGroup.Root
                              value={
                                telephonyFormData.inbound_enabled
                                  ? "Inbound"
                                  : telephonyFormData.outbound_enabled
                                    ? "Outbound"
                                    : ""
                              }
                              css={{
                                "& [data-checked]": {
                                  border: "none !important",
                                },
                              }}
                              onValueChange={(e) => {
                                const val = e.value;
                                if (val === "Inbound") {
                                  setValue("inbound_enabled", true);
                                  setValue("outbound_enabled", false);
                                } else {
                                  setValue("inbound_enabled", false);
                                  setValue("outbound_enabled", true);
                                }
                              }}
                              size={{
                                base: "sm",
                                "3xl": "sm",
                                "4xl": "md",
                              }}
                            >
                              <HStack gap={2}>
                                <RadioGroup.Item value="Inbound">
                                  <RadioGroup.ItemHiddenInput />
                                  <RadioGroup.ItemIndicator
                                    _checked={{
                                      bgImage:
                                        "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                      borderColor: "transparent",
                                    }}
                                    borderColor="#2f4d78"
                                    bgColor={"black"}
                                  />
                                  <RadioGroup.ItemText
                                    letterSpacing={"wider"}
                                    fontWeight={"light"}
                                  >
                                    Inbound
                                  </RadioGroup.ItemText>
                                </RadioGroup.Item>

                                <RadioGroup.Item value="Outbound">
                                  <RadioGroup.ItemHiddenInput />
                                  <RadioGroup.ItemIndicator
                                    _checked={{
                                      bgImage:
                                        "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                      borderColor: "transparent",
                                    }}
                                    borderColor="#2f4d78"
                                    bgColor={"black"}
                                  />
                                  <RadioGroup.ItemText
                                    letterSpacing={"wider"}
                                    fontWeight={"light"}
                                  >
                                    Outbound
                                  </RadioGroup.ItemText>
                                </RadioGroup.Item>
                              </HStack>
                            </RadioGroup.Root>
                          </Box>

                          {/* System Integration Checkbox */}
                          <Checkbox.Root
                            size="sm"
                            checked={lifecycleState.withSystem}
                            onCheckedChange={({ checked }) =>
                              setLifecycleState((prev) => ({
                                ...prev,
                                withSystem: checked,
                                withApi: checked ? prev.withApi : false,
                              }))
                            }
                          >
                            <Checkbox.Control
                              _checked={{
                                bgImage:
                                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                              }}
                              borderColor="#2f4d78"
                              bgColor={"black"}
                            />
                            <Checkbox.Label
                              letterSpacing={"widest"}
                              fontWeight={"light"}
                              lineHeight={"initial"}
                              fontSize="xs"
                              color="white"
                            >
                              System <br /> Integration
                            </Checkbox.Label>
                            <Checkbox.HiddenInput />
                          </Checkbox.Root>

                          {/* API Radio - only visible when System Integration is checked */}
                          {lifecycleState.withSystem && (
                            <VStack alignItems={"flex-start"} gap={1}>
                              <Text
                                fontSize="xs"
                                color="gray.400"
                                letterSpacing="wider"
                              >
                                API
                              </Text>
                              <RadioGroup.Root
                                value={lifecycleState.withApi ? "Yes" : "No"}
                                css={{
                                  "& [data-checked]": {
                                    border: "none !important",
                                  },
                                }}
                                onValueChange={(e) => {
                                  setLifecycleState((prev) => ({
                                    ...prev,
                                    withApi: e.value === "Yes",
                                  }));
                                }}
                                size={{
                                  base: "sm",
                                  "3xl": "sm",
                                  "4xl": "md",
                                }}
                              >
                                <HStack gap={2}>
                                  <RadioGroup.Item value="Yes">
                                    <RadioGroup.ItemHiddenInput />
                                    <RadioGroup.ItemIndicator
                                      _checked={{
                                        bgImage:
                                          "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                        borderColor: "transparent",
                                      }}
                                      borderColor="#2f4d78"
                                      bgColor={"black"}
                                    />
                                    <RadioGroup.ItemText
                                      letterSpacing={"wider"}
                                      fontWeight={"light"}
                                    >
                                      Yes
                                    </RadioGroup.ItemText>
                                  </RadioGroup.Item>
                                  <RadioGroup.Item value="No">
                                    <RadioGroup.ItemHiddenInput />
                                    <RadioGroup.ItemIndicator
                                      _checked={{
                                        bgImage:
                                          "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                        borderColor: "transparent",
                                      }}
                                      borderColor="#2f4d78"
                                      bgColor={"black"}
                                    />
                                    <RadioGroup.ItemText
                                      letterSpacing={"wider"}
                                      fontWeight={"light"}
                                    >
                                      No
                                    </RadioGroup.ItemText>
                                  </RadioGroup.Item>
                                </HStack>
                              </RadioGroup.Root>
                            </VStack>
                          )}
                        </HStack>
                      </Box>
                    </HStack>
                  </VStack>
                </HStack>

                {telephonyFormData.outbound_enabled && (
                  <Flex gapX={4}>
                    <div className="w-[100px] shrink-0"></div>
                    <Box
                      shrink={0}
                      w={{
                        "2xl": "105px",
                        "3xl": "150px",
                      }}
                    >
                      <Text
                        mb={1}
                        color="gray.400"
                        fontSize="xs"
                        letterSpacing={"wider"}
                        fontWeight={"light"}
                      >
                        Timezone
                      </Text>
                      <Controller
                        name="timezone"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            value={field.value ? [field.value] : []}
                            onValueChange={(v) => field.onChange(v[0])}
                            options={TIMEZONE_OPTIONS}
                            placeholder="Select Timezone"
                            w="100%"
                            size={{
                              base: "xs",
                              "3xl": "sm",
                              "4xl": "md",
                            }}
                            css={{
                              "& button": {
                                borderRadius: "4px !important",
                                borderColor: "#2f4d78",
                              },
                            }}
                          />
                        )}
                      />
                    </Box>
                    <HStack gap={4}>
                      <Box flex={1}>
                        <Text
                          mb={1}
                          color="gray.400"
                          fontSize="xs"
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                        >
                          Start Time
                        </Text>
                        <CustomInput
                          type="time"
                          {...control.register("startTime")}
                          size="sm"
                          className=" !border-[#2f4d78] !text-white !rounded-[4px]"
                        />
                      </Box>
                      <Box flex={1}>
                        <Text
                          mb={1}
                          color="gray.400"
                          fontSize="xs"
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                        >
                          End Time
                        </Text>
                        <CustomInput
                          type="time"
                          {...control.register("endTime")}
                          size="sm"
                          className=" !border-[#2f4d78] !text-white !rounded-[4px]"
                        />
                      </Box>
                      {/* <Box
                        flex={1}
                        display="flex"
                        flexDirection="column"
                        justifyContent="flex-end"
                        alignItems="flex-end"
                        alignSelf={"flex-end"}
                        pb={1}
                      >
                        <Controller
                          name="weekendSupport"
                          control={control}
                          render={({ field }) => (
                            <Checkbox.Root
                              size="sm"
                              checked={!!field.value}
                              onCheckedChange={({ checked }) =>
                                field.onChange(checked)
                              }
                            >
                              <Checkbox.Control
                                _checked={{
                                  bgImage:
                                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                }}
                                borderColor="#2f4d78"
                                bgColor={"black"}
                              />
                              <Checkbox.Label
                                letterSpacing={"wider"}
                                fontWeight={"light"}
                                lineHeight={"initial"}
                                fontSize="xs"
                                color="gray.400"
                              >
                                Weekend Support
                              </Checkbox.Label>
                              <Checkbox.HiddenInput />
                            </Checkbox.Root>
                          )}
                        />
                      </Box> */}

                      <Box
                        flex={3}
                        display="flex"
                        flexDirection="column"
                        justifyContent="flex-end"
                        alignItems="flex-start"
                        alignSelf={"flex-end"}
                        // pb={1}
                      >
                        <Controller
                          name="activeDays"
                          control={control}
                          render={({ field }) => (
                            <HStack
                              gap={{
                                base: "4px",
                                "2xl": "6px",
                                "3xl": "8px",
                              }}
                            >
                              {["M", "T", "W", "T", "F", "S", "S"].map(
                                (day, idx) => {
                                  const dayValue = idx.toString();
                                  const isSelected =
                                    field.value?.includes(dayValue);
                                  return (
                                    <Box
                                      key={idx}
                                      as="button"
                                      type="button"
                                      onClick={() => {
                                        const current = field.value || [];
                                        if (isSelected) {
                                          field.onChange(
                                            current.filter(
                                              (d) => d !== dayValue,
                                            ),
                                          );
                                        } else {
                                          field.onChange([
                                            ...current,
                                            dayValue,
                                          ]);
                                        }
                                      }}
                                      w={{
                                        base: "24px",
                                        "2xl": "30px",
                                        "3xl": "36px",
                                      }}
                                      h={{
                                        base: "24px",
                                        "2xl": "30px",
                                        "3xl": "36px",
                                      }}
                                      borderRadius="50%"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      fontSize={{
                                        base: "12px",
                                        "2xl": "14px",
                                        "3xl": "16px",
                                      }}
                                      fontWeight="medium"
                                      bg={
                                        isSelected
                                          ? "var(--bg-blue-gradient)"
                                          : "rgb(238, 238, 238)"
                                      }
                                      color={
                                        isSelected ? "white" : "rgb(51, 51, 51)"
                                      }
                                      _hover={{
                                        opacity: 0.8,
                                      }}
                                      transition="all 0.2s"
                                    >
                                      {day}
                                    </Box>
                                  );
                                },
                              )}
                            </HStack>
                          )}
                        />
                      </Box>
                    </HStack>
                  </Flex>
                )}
              </VStack>
            </GridItem>

            {/* RIGHT COLUMN: PHONE SETTINGS */}
            <GridItem
              borderLeft={{ lg: "1px solid #2f4d78" }}
              borderColor="#2f4d78"
              pl={{ lg: 4 }}
            >
              <HStack justify="space-between" align="center" mb={4}>
                <HStack gap={3}>
                  <span className="green-gradient-icon">
                    <Phone size={24} strokeWidth={"2"} />
                  </span>
                  <Text
                    fontSize="md"
                    fontWeight="semibold"
                    letterSpacing="wide"
                  >
                    Phone Settings{" "}
                    {(telephonyLoading || telephonyPlaceholder) && (
                      <Spinner size="xs" ml={2} />
                    )}
                  </Text>
                </HStack>
                <CustomButton
                  size="sm"
                  onClick={handleSubmit(handleUnifiedSave)}
                  loading={isUpdateLoading}
                >
                  Save
                </CustomButton>
              </HStack>
              <VStack align="stretch" gap={6} h="full">
                {/* Buy Phone Numbers */}
                {/* <Box
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  rounded="lg"
                  p={{
                    base: 2,
                    "3xl": 3,
                  }}
                  maxH={"30vh"}
                  overflow={"auto"}
                >
                  <HStack>
                    <button
                      type="button"
                      onClick={() => {
                        // Removed unused variable
                        // const generated = ...
                        setShowBuyPicker((s) => !s);
                        setBuyableNumbers(getnumbers?.result || []);
                        // Removed set;
                      }}
                      className="flex items-center justify-between w-full text-sm text-neutral-300"
                    >
                      <span>Buy Phone Numbers</span>
                      <span className="text-xs">
                        {showBuyPicker ? "Hide" : "Show"}
                      </span>
                    </button>
                  </HStack>

                  {showBuyPicker && (
                    <VStack gap={2} mt={4} align="stretch">
                      {buyableNumbers?.map((number) => (
                        <HStack key={number.phone_number}>
                          <Box
                            flex={1}
                            px={3}
                            py={2}
                            rounded="md"
                            border="1px dashed"
                            borderColor="whiteAlpha.300"
                          >
                            <Text fontSize="sm">{number.phone_number}</Text>
                          </Box>

                          <IconButton
                            size="sm"
                            aria-label="Buy number"
                            onClick={() => {
                              buyNumbers({ phone_number: number.phone_number });
                              toaster.success({
                                title: "Number Purchased",
                                description: `${number.phone_number} added to available numbers`,
                              });
                            }}
                          >
                            <Plus size={14} />
                          </IconButton>
                        </HStack>
                      ))}
                      {buyableNumbers.length === 0 && (
                        <Text fontSize="sm" color="gray.500">
                          No more numbers available.
                        </Text>
                      )}
                    </VStack>
                  )}
                </Box> */}

                {/* Phone Numbers List */}
                <Box
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  rounded="4px"
                  maxH={"30vh"}
                  overflow={"auto"}
                  p={{
                    base: 2,
                    "3xl": 3,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowPhones((s) => !s)}
                    className="flex items-center justify-between w-full text-sm text-neutral-300"
                  >
                    <span>
                      Phone Numbers (
                      {telephonyFormData.phone_number?.length || 0})
                    </span>
                    <span className="text-xs">
                      {showPhones ? "Hide" : "Show"}
                    </span>
                  </button>

                  {showPhones && (
                    <VStack gap={4} align="stretch" mt={2}>
                      {/* <Box>
                        <Text fontSize="sm" color="gray.400" mb={2}>
                          Assigned Numbers (click to select primary)
                        </Text>
                        {telephonyFormData.phone_number?.map(
                          (number, index) => (
                            <HStack key={index}>
                              <HStack
                                flex={1}
                                px={3}
                                py={2}
                                rounded="md"
                                cursor="pointer"
                                border="2px solid"
                                borderColor={
                                  telephonyFormData.primary_phone_number ===
                                  number
                                    ? "blue.500"
                                    : "whiteAlpha.200"
                                }
                                bg={"whiteAlpha.100"}
                                onClick={() =>
                                  setValue("primary_phone_number", number)
                                }
                              >
                                <Phone size={14} />
                                <Text fontSize="sm">{number}</Text>
                              </HStack>
                              <IconButton
                                size="sm"
                                aria-label="Remove phone"
                                onClick={() => {
                                  const updated =
                                    telephonyFormData.phone_number.filter(
                                      (_, i) => i !== index,
                                    );
                                  setValue("phone_number", updated);
                                  if (
                                    telephonyFormData.primary_phone_number ===
                                    number
                                  ) {
                                    setValue(
                                      "primary_phone_number",
                                      updated[0] || null,
                                    );
                                  }
                                }}
                              >
                                <X size={14} />
                              </IconButton>
                            </HStack>
                          ),
                        )}
                      </Box> */}

                      {showAvailablePicker && (
                        <Box>
                          <Text
                            display={"flex"}
                            justifyContent={"space-between"}
                            w="full"
                            fontSize="sm"
                            color="gray.400"
                          >
                            <span>Available Numbers</span>
                            <button
                              onClick={() => setIsBuyNumberOpen(true)}
                              className="cursor-pointer text-[var(--chakra-colors-primary-400)] hover:underline"
                            >
                              <Span color={"inherit"}>Buy Phone Numbers</Span>
                            </button>
                          </Text>
                          <VStack gap={2} align="stretch">
                            {(telephonyFormData.phone_number || []).map(
                              (number, index) => (
                                <HStack key={index} gap={2}>
                                  <Box flex={1}>
                                    <CustomSelect
                                      options={(mobileNumbersData || [])
                                        .filter((num) => {
                                          const numStr =
                                            num.mobile_number ||
                                            num.phone_number ||
                                            num;
                                          // Available if no telephony_settings OR it's the current value
                                          return (
                                            !num.telephony_settings ||
                                            numStr === number
                                          );
                                        })
                                        .filter((num) => {
                                          const numStr =
                                            num.mobile_number ||
                                            num.phone_number ||
                                            num;
                                          // And also not selected in other slots
                                          return (
                                            !telephonyFormData.phone_number?.includes(
                                              numStr,
                                            ) || numStr === number
                                          );
                                        })
                                        .map((num) => ({
                                          label:
                                            num.mobile_number ||
                                            num.phone_number ||
                                            num,
                                          value:
                                            num.mobile_number ||
                                            num.phone_number ||
                                            num,
                                          avatar:
                                            "https://flagcdn.com/w40/us.png",
                                        }))}
                                      value={number ? [number] : []}
                                      placeholder="Select phone number"
                                      onValueChange={(v) => {
                                        const selectedNumber = v[0];
                                        if (!selectedNumber) return;
                                        const current = [
                                          ...(telephonyFormData.phone_number ||
                                            []),
                                        ];
                                        if (
                                          current.includes(selectedNumber) &&
                                          current[index] !== selectedNumber
                                        ) {
                                          toaster.warning({
                                            title: "Number already selected",
                                          });
                                          return;
                                        }
                                        current[index] = selectedNumber;
                                        setValue("phone_number", current);
                                        if (
                                          !telephonyFormData.primary_phone_number
                                        ) {
                                          setValue(
                                            "primary_phone_number",
                                            selectedNumber,
                                          );
                                        }
                                      }}
                                      w="full"
                                      size="sm"
                                      css={{
                                        "& button": {
                                          borderRadius: "4px !important",
                                          borderColor: "#2f4d78",
                                        },
                                      }}
                                    />
                                  </Box>
                                  <Tooltip content="Set as primary">
                                    <IconButton
                                      aria-label="Set as primary"
                                      onClick={() =>
                                        setValue("primary_phone_number", number)
                                      }
                                      size="sm"
                                      variant="ghost"
                                      color="#2f4d78"
                                      border="1px solid #2f4d78"
                                      borderRadius="4px"
                                      _hover={{
                                        bg: "transparent",
                                        color: "white",
                                      }}
                                    >
                                      <Phone size={14} />
                                    </IconButton>
                                  </Tooltip>
                                  <IconButton
                                    size="sm"
                                    variant="ghost"
                                    color="#2f4d78"
                                    border="1px solid #2f4d78"
                                    borderRadius="4px"
                                    _hover={{
                                      bg: "transparent",
                                      color: "white",
                                    }}
                                    aria-label="Remove phone"
                                    onClick={() => {
                                      const updated =
                                        telephonyFormData.phone_number.filter(
                                          (_, i) => i !== index,
                                        );
                                      setValue("phone_number", updated);
                                      if (
                                        telephonyFormData.primary_phone_number ===
                                        number
                                      ) {
                                        setValue(
                                          "primary_phone_number",
                                          updated[0] || null,
                                        );
                                      }
                                    }}
                                  >
                                    <X size={14} />
                                  </IconButton>
                                </HStack>
                              ),
                            )}
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                const availableNumbers = (
                                  mobileNumbersData || []
                                ).filter((num) => {
                                  const numStr =
                                    num.mobile_number ||
                                    num.phone_number ||
                                    num;
                                  return (
                                    !num.telephony_settings &&
                                    !telephonyFormData.phone_number?.includes(
                                      numStr,
                                    )
                                  );
                                });

                                if (availableNumbers.length === 0) {
                                  toaster.error({
                                    title: "No Available Numbers Found",
                                    description:
                                      "Please purchase a new number or release existing ones.",
                                  });
                                  return;
                                }
                                const current =
                                  telephonyFormData.phone_number || [];
                                setValue("phone_number", [...current, ""]);
                              }}
                              borderColor="#2f4d78"
                              color="gray.400"
                              _hover={{ color: "white", bg: "whiteAlpha.100" }}
                              mt={2}
                            >
                              <Plus size={14} className="mr-1" /> Add Number
                            </Button>
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  )}
                </Box>

                {/* Settings Grid */}
                <SimpleGrid
                  columns={"2"}
                  gapX={{ base: 4, "3xl": 6 }}
                  gapY={{ base: 4 }}
                >
                  <Box>
                    <Text
                      mb={1}
                      color="gray.300"
                      fontSize="xs"
                      letterSpacing={"wider"}
                      fontWeight={"light"}
                    >
                      Max Concurrent Calls
                    </Text>
                    <Controller
                      name="max_concurrent_calls"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          value={field.value ? [field.value.toString()] : []}
                          onValueChange={(v) => field.onChange(Number(v[0]))}
                          options={MAX_CONCURRENT_CALLS_OPTIONS}
                          placeholder="Select Max Concurrent Calls"
                          w="100%"
                          size={{
                            base: "xs",
                            "3xl": "sm",
                            "4xl": "md",
                          }}
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                            },
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Box>
                    <Text
                      mb={1}
                      color="gray.300"
                      fontSize="xs"
                      letterSpacing={"wider"}
                      fontWeight={"light"}
                    >
                      Call Recording
                    </Text>
                    <Controller
                      name="call_recording"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          value={
                            field.value !== undefined
                              ? [field.value ? "true" : "false"]
                              : []
                          }
                          onValueChange={(v) => field.onChange(v[0] === "true")}
                          options={CALL_RECORDING_OPTIONS}
                          placeholder="Select Call Recording"
                          w="100%"
                          size={{
                            base: "xs",
                            "3xl": "sm",
                            "4xl": "md",
                          }}
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                </SimpleGrid>
              </VStack>
            </GridItem>
          </Grid>
        </Box>

        <Box
          className="bg-droidal-black-300 animated-gradient-card"
          p={4}
          borderRadius="xl"
        >
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between" align="center">
              <HStack gap={3}>
                <span className="green-gradient-icon">
                  <PhoneCall size={24} strokeWidth={"2"} />
                </span>
                <Text fontSize="md" fontWeight="semibold" letterSpacing="wide">
                  Call Settings{" "}
                  {(lifeCycleLoading || telephonyLoading) && (
                    <Spinner size="xs" />
                  )}
                </Text>
              </HStack>
            </HStack>

            <Grid templateColumns="1fr" gap={6}>
              <GridItem>
                <RoutingLifecycleSections
                  value={lifecycleState}
                  errors={lifecycleErrors}
                  onChange={(nextValue) => setLifecycleState(nextValue)}
                  showTriggerRetry={true}
                  hideLLMAndRetry={true}
                  showFunctionPanels={false}
                />
              </GridItem>

              {/* <GridItem>
        <VStack align="stretch" h="full" gap={4}>
         
        </VStack>
      </GridItem> */}

              {lifecycleState.withApi && (
                <GridItem colSpan={2}>
                  <RoutingLifecycleSections
                    value={lifecycleState}
                    errors={lifecycleErrors}
                    onChange={(nextValue) => setLifecycleState(nextValue)}
                    showTriggerRetry={true}
                    hideLLMAndRetry={true}
                    showBaseSection={false}
                    showFunctionPanels={true}
                  />
                </GridItem>
              )}
            </Grid>
          </VStack>
        </Box>

        {/* Agent Versioning */}
        <Box
          className="bg-droidal-black-300 animated-gradient-card"
          p={4}
          borderRadius="xl"
          flex="1"
          display="flex"
          flexDirection="column"
          h="50vh"
        >
          <Flex justify="space-between" align="center" mb={2}>
            <HStack gap={3}>
              <span className="green-gradient-icon">
                <RefreshCw size={24} strokeWidth={"2"} />
              </span>
              <Text fontSize="md" fontWeight="semibold" letterSpacing="wide">
                Agent Versioning
              </Text>
            </HStack>
          </Flex>

          <Box flex="1">
            <GenericTable
              containerProps={{ h: "full" }}
              data={versions || []}
              columns={columns}
              pagination={true}
              count={versions?.length || 0}
              tableProps={{
                size: {
                  base: "sm",
                  "2xl": "sm",
                  "3xl": "md",
                  "4xl": "lg",
                },
              }}
              selection={{
                selectable: false,
                checkboxProps: {},
                onSelectChange: () => {},
                checkPermission: () => true,
                onConfirm: () => Promise.resolve(true),
              }}
              bodyHeight="100%"
            />
          </Box>
        </Box>
      </Box>
      <BuyNumberDialog
        open={isBuyNumberOpen}
        onClose={() => setIsBuyNumberOpen(false)}
      />
    </Flex>
  );
};

export default VoiceAiBasics;
