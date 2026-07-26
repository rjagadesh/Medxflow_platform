import React, { useState, useMemo, useEffect } from "react";
import {
  User,
  Calendar,
  Phone,
  Stethoscope,
  MapPin,
  DollarSign,
  Plus,
  X,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  Receipt,
  AlertCircle,
  Info,
  CreditCard
} from "lucide-react";
import { useParams, useLocation } from "react-router-dom";
import { Box, Flex, Text, HStack, Avatar, Portal, List, Spinner, Input } from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import CustomAmountInput from "@/components/input/amountInput";
import { toaster } from "@/components/ui/toaster";
import { useGetPatientById } from "@/hooks/query/pms/pms_appointments/useGetPatientById";
import { useFetchFeeSchedule } from "@/hooks/query/pms/encounter/useFetchFeeSchedule";
import { useGetPatientPayments } from "@/hooks/query/pms/patient/useGetPatientPayments";
import { useMakePatientPayment } from "@/hooks/mutation/pms/patient/useMakePatientPayment";
import { pdf } from "@react-pdf/renderer";
import PaymentReceiptPDF from "./components/PaymentReceiptPDF";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/utils/helper";
import ApiConstant from "@/services/constant";
import { useRef } from "react";

const BASE_URL = ApiConstant.BASE_URL;

const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} style={{ color: "#00AEEF", fontWeight: "bold" }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const ProcedureSearchInput = ({
  value,
  onChange,
  onKeyDown,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const dropdownRef = useRef(null);

  const { data: responseData, isLoading } = useFetchFeeSchedule({
    search: debouncedSearchTerm,
    page_size: 20,
  });

  const options = useMemo(() => {
    const data = Array.isArray(responseData)
      ? responseData
      : responseData?.results;
    if (!data) return [];
    return data.map((item) => ({
      value: item.procedure_code,
      label: item.description
        ? `${item.procedure_code} - ${item.description}`
        : item.procedure_code,
      charge: item.par_amount || item.charge,
    }));
  }, [responseData]);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelect = (option) => {
    setSearchTerm(option.value);
    onChange(option.value, option.charge);
    setIsOpen(false);
  };

  return (
    <Box position="relative" w="full" ref={dropdownRef}>
      <HStack w="full" position="relative">
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Procedure..."
          autoComplete="off"
          bg="#0a2040"
          border="1px solid #1e4270"
          color="white"
          _focus={{
            borderColor: "#00BBF2",
            boxShadow: "0 0 0 2px #00BBF2",
          }}
          {...props}
        />
        {isLoading && (
          <Box position="absolute" right="10px">
            <Spinner size="xs" color="#00AEEF" />
          </Box>
        )}
      </HStack>

      {isOpen && (options.length > 0 || isLoading) && (
        <Portal>
          <Box
            position="fixed"
            top={`${
              dropdownRef.current?.getBoundingClientRect().bottom +
              window.scrollY
            }px`}
            left={`${
              dropdownRef.current?.getBoundingClientRect().left + window.scrollX
            }px`}
            width={`${dropdownRef.current?.offsetWidth}px`}
            bg="#0d2b52"
            border="1px solid #1e4270"
            borderRadius="md"
            boxShadow="lg"
            zIndex={2000}
            maxH="250px"
            overflowY="auto"
          >
            {isLoading ? (
              <Box p={3} textAlign="center">
                <Spinner size="sm" color="#00AEEF" />
              </Box>
            ) : options.length > 0 ? (
              <List.Root variant="none">
                {options.map((opt, idx) => (
                  <List.Item
                    key={idx}
                    px={3}
                    py={2}
                    cursor="pointer"
                    color="white"
                    fontSize="sm"
                    _hover={{ bg: "whiteAlpha.200" }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(opt);
                    }}
                  >
                    <HighlightText text={opt.label} highlight={searchTerm} />
                  </List.Item>
                ))}
              </List.Root>
            ) : (
              <Box p={3} color="gray.400" fontSize="sm">
                No procedures found.
              </Box>
            )}
          </Box>
        </Portal>
      )}
    </Box>
  );
};

const PaymentsHub = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const passedAppointment = location.state?.appointment;

  const { data: patientDetails } = useGetPatientById(patientId);
  const { data: paymentHistory, isLoading: isLoadingHistory } =
    useGetPatientPayments({
      patient_id: patientId,
      appointment_id: passedAppointment?.id,
    });
  const { mutate: makePayment, isLoading: isPaying } = useMakePatientPayment();

  const [isNoteActive, setIsNoteActive] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");

  // Pre-fill amount from appointment if available
  const initialAmount = useMemo(() => {
    if (passedAppointment) {
      const coPay = parseFloat(passedAppointment.coPay) || 0;
      const deposit = parseFloat(passedAppointment.deposit) || 0;
      const total = coPay + deposit;
      return total > 0 ? total.toString() : "";
    }
    return "";
  }, [passedAppointment]);

  const [paymentAmount, setPaymentAmount] = useState(initialAmount);
  const [note, setNote] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [services, setServices] = useState([
    { id: 1, service: "", mod: "", units: 1, charge: 0, total: 0 }
  ]);

  const handleNumberWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const input = e.currentTarget;
    input.blur();

    requestAnimationFrame(() => {
      input.focus();
    });
  };

  // Credit Card Details
  const [ccDetails, setCcDetails] = useState({
    number: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: ""
  });

  const lightGradient = "var(--bg-blue-gradient2)";

  // Checkboxes
  const [doNotChargeCC, setDoNotChargeCC] = useState(false);
  const [sameAsPatientAddress, setSameAsPatientAddress] = useState(true);

  const handleAddService = () => {
    setServices([...services, { id: services.length + 1, service: "", mod: "", units: 1, charge: 0, total: 0 }]);
  };

  const updateService = (id, field, value, charge = null) => {
    setServices(services.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        if (field === "service" && charge !== null) {
          updated.charge = charge;
        }
        if (field === "charge" || field === "units" || (field === "service" && charge !== null)) {
          updated.total = (parseFloat(updated.charge) || 0) * (parseInt(updated.units) || 1);
        }
        return updated;
      }
      return s;
    }));
  };

  const totalCharge = useMemo(() => {
    return services.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
  }, [services]);

  const handleCollectPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toaster.error({
        title: "Error",
        description: "Please enter a valid payment amount.",
      });
      return;
    }

    if (paymentMethod === "Credit Card") {
      if (
        !ccDetails.number ||
        !ccDetails.expiryMonth ||
        !ccDetails.expiryYear ||
        !ccDetails.cvv
      ) {
        toaster.error({
          title: "Required Fields Missing",
          description: "Please fill in all credit card details.",
        });
        return;
      }
    }

    const payload = {
      patient_id: patientId,
      appointment_id: passedAppointment?.id,
      payment_type: paymentMethod,
      payment_amount: paymentAmount,
      check_number: paymentMethod === "Check" ? ccDetails.number : null, // Assuming number field used for check number if Check
      payment_date: new Date().toISOString().split("T")[0],
    };

    makePayment(payload, {
      onSuccess: async (response) => {
        setIsSuccess(true);

        // Prepare receipt data
        const receiptData = {
          patientName: `${item.first_name} ${item.last_name}`,
          paymentId: response?.payment_id || response?.data?.payment_id || "N/A",
          paymentDate: new Date().toLocaleDateString(),
          paymentMethod: paymentMethod,
          amount: paymentAmount,
          services: services.filter((s) => s.service), // Only include services with a name
          providerName: passedAppointment?.providerName,
          locationName: passedAppointment?.locationName,
        };

        // Generate and download PDF
        try {
          const doc = <PaymentReceiptPDF data={receiptData} />;
          const blob = await pdf(doc).toBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const patientIdPrefix = patientId?.split("-")[0] || "Unknown";
          link.download = `Receipt_${patientIdPrefix}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (pdfError) {
          console.error("PDF Generation Error:", pdfError);
        }

        toaster.success({
          title: "Success",
          description: "Payment collected and receipt downloaded.",
        });
      },
      onError: (error) => {
        toaster.error({
          title: "Payment Failed",
          description: error?.message || "Something went wrong.",
        });
      },
    });
  };

  const handleMakeNewPayment = () => {
    setIsSuccess(false);
    setPaymentAmount("");
    setNote("");
    setIsNoteActive(false);
    setCcDetails({ number: "", expiryMonth: "", expiryYear: "", cvv: "" });
  };

  const DetailItem = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between gap-4 group">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-[#808080] group-hover:text-[#4f8fce] transition-colors" />}
        <label className="text-[11px] font-bold text-[#808080] uppercase tracking-wider">{label}</label>
      </div>
      <p className="text-sm text-white font-medium text-right">{value}</p>
    </div>
  );

  const item = useMemo(() => {
    if (patientDetails) {
      const rawProfilePic = patientDetails.profilePicture || patientDetails.profile_picture_url || patientDetails.profile_picture || "";
      let profilePicUrl = "";
      
      if (rawProfilePic) {
        // If it's a full URL, extract the path after 'media/' to ensure we use our BASE_URL
        const mediaIndex = rawProfilePic.indexOf('/media/');
        console.log("Raw Profile Picture URL:", rawProfilePic);
        console.log("Media Index:", mediaIndex);
        const path = mediaIndex !== -1 ? rawProfilePic.substring(mediaIndex) : rawProfilePic;
        profilePicUrl = `${BASE_URL}${path.startsWith("/") ? path.substring(1) : path}/`;
        console.log("Final Profile Picture URL:", profilePicUrl);
      }

      return {
        first_name: patientDetails.first_name || "",
        last_name: patientDetails.last_name || "",
        dob: patientDetails.dob || "",
        gender: patientDetails.gender || "",
        mobile_phone: patientDetails.mobile_phone || "",
        profile_picture: profilePicUrl,
        insurance_name: {
          displayName: patientDetails.insurance_name?.displayName || "Not Specified",
          avatarUrl: patientDetails.insurance_name?.avatarUrl || ""
        }
      };
    }
    return {
      first_name: "",
      last_name: "",
      dob: "",
      gender: "",
      mobile_phone: "",
      profile_picture: "",
      insurance_name: {
        displayName: "Not Specified",
        avatarUrl: ""
      }
    };
  }, [patientDetails]);

  return (
    <div className="w-full h-full bg-[#0a2040] p-4 space-y-8 overflow-y-auto">
      
      {/* Patient and Visit Details Card (Enhanced) */}
      <Box
        p={2}
        borderRadius="12px"
        border="1px solid rgba(255,255,255,0.12)"
        bg="#0d2b52"
        position="relative"
        boxShadow="sm"
      >
        <Flex w="100%" gap={8} align="center">
            {/* Patient Photo & Primary Details */}
            <Flex gap={6} flex="1" align="center">
                <Box
                  w="120px"
                  h="120px"
                  borderRadius="12px"
                  overflow="hidden"
                  border="2px solid rgba(255,255,255,0.2)"
                  flexShrink={0}
                >
                  <img
                    src={item.profile_picture}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/PersonPlaceholder.png";
                    }}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>

                <Box flex="1">
                    <Text fontSize="2xl" mb={3} color="#00AEEF" fontWeight="medium">
                      {item.first_name || "Patient"} {item.last_name || "Name"}
                    </Text>
                    <div className="grid grid-cols-1 gap-y-2">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#808080]" />
                            <span className="text-xs text-[#808080] uppercase font-bold tracking-wider">DOB:</span>
                            <span className="text-sm text-white font-medium">{item.dob ? formatDate(item.dob, "MM/dd/yyyy") : "Not Specified"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User size={14} className="text-[#808080]" />
                            <span className="text-xs text-[#808080] uppercase font-bold tracking-wider">Gender:</span>
                            <span className="text-sm text-white font-medium">{item.gender || "Not Specified"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone size={14} className="text-[#808080]" />
                            <span className="text-xs text-[#808080] uppercase font-bold tracking-wider">Phone:</span>
                            <span className="text-sm text-white font-medium">{item.mobile_phone}</span>
                        </div>
                    </div>
                </Box>
            </Flex>

            {/* DIVIDER */}
            <Box
              w="1px"
              bg="rgba(255,255,255,0.15)"
              height="80px"
              flexShrink={0}
            />

            {/* VISIT DETAILS */}
            <Box flex="1">
                <Text fontSize="lg" mb={3} color="white" fontWeight="medium">
                    Visit Details
                </Text>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex items-center gap-2">
                        <Stethoscope size={14} className="text-[#808080]" />
                        <span className="text-xs text-[#808080] uppercase font-bold tracking-wider">Provider:</span>
                        <span className="text-sm text-white font-medium">{passedAppointment?.providerName || "Not Specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#808080]" />
                        <span className="text-xs text-[#808080] uppercase font-bold tracking-wider">Location:</span>
                        <span className="text-sm text-white font-medium">{passedAppointment?.locationName || "Not Specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#808080]" />
                        <span className="text-xs text-[#808080] uppercase font-bold tracking-wider">DoS:</span>
                        <span className="text-sm text-white font-medium">{passedAppointment?.date ? formatDate(passedAppointment.date, "MM/dd/yyyy") : "Not Specified"}</span>
                    </div>
                </div>
            </Box>

            {/* DIVIDER */}
            <Box
              w="1px"
              bg="rgba(255,255,255,0.15)"
              height="80px"
              flexShrink={0}
            />

            {/* INSURANCE */}
            <Box flex="0.8">
                <Text fontSize="lg" mb={3} color="white" fontWeight="medium">Insurance</Text>
                <HStack gap={3}>
                  {item.insurance_name.displayName !== "Not Specified" ? (
                    <>
                      <Avatar.Root
                        shape="rounded"
                        size="xs"
                        border="1px solid rgba(255,255,255,0.1)"
                      >
                        <Avatar.Image
                          src={item.insurance_name.avatarUrl}
                          alt={item.insurance_name.displayName}
                        />
                        <Avatar.Fallback
                          name={item.insurance_name.displayName}
                        />
                      </Avatar.Root>
                      <Text fontSize="sm" color="#00AEEF" fontWeight="medium" noOfLines={2}>
                        {item.insurance_name.displayName}
                      </Text>
                    </>
                  ) : (
                    <Text fontSize="sm" color="#808080" fontWeight="medium">Not Specified</Text>
                  )}
                </HStack>
            </Box>
        </Flex>
      </Box>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Service Rendered Card */}
          <div className="bg-[#0d2b52] mt-3 border border-[#1e4270] rounded-xl overflow-hidden shadow-sm">
            <div className="p-2 border-b border-[#1e4270] flex justify-between items-center bg-[#16375e]">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Receipt size={18} className="text-cyan-500" /> Service Rendered
              </h4>
              <button 
                onClick={handleAddService}
                className="text-cyan-500 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-cyan-500/10 transition-all flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
              >
                <Plus size={16} /> Add Service
              </button>
            </div>
            <div className="overflow-x-auto max-h-[200px] overflow-y-auto relative">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#16375e] text-[#808080] text-[11px] uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-2 font-semibold text-center bg-[#16375e]">Service</th>
                    <th className="px-5 py-2 font-semibold w-24 text-center bg-[#16375e]">Mod</th>
                    <th className="px-5 py-2 font-semibold w-24 text-center bg-[#16375e]">Units</th>
                    <th className="px-5 py-2 font-semibold w-36 text-center bg-[#16375e]">Charge</th>
                    <th className="px-5 py-2 font-semibold w-36 text-center bg-[#16375e]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e4270]">
                  {services.map((s) => (
                    <tr key={s.id} className="group hover:bg-[#0a2040]/50 transition-colors">
                      <td className="px-5 py-1">
                        <ProcedureSearchInput 
                          value={s.service}
                          onChange={(val, charge) => updateService(s.id, "service", val, charge)}
                        />
                      </td>
                      <td className="px-5 py-1">
                        <input 
                          type="text" 
                          value={s.mod}
                          onChange={(e) => updateService(s.id, "mod", e.target.value)}
                          className="w-full bg-[#0a2040] border border-[#1e4270] rounded-lg px-3 py-2.5 text-sm text-white focus:border-cyan-500 outline-none text-center h-[40px]"
                        />
                      </td>
                      <td className="px-5 py-1">
                        <input 
                          type="number" 
                          value={s.units}
                          onChange={(e) => updateService(s.id, "units", e.target.value)}
                          className="w-full bg-[#0a2040] border border-[#1e4270] rounded-lg px-3 py-2.5 text-sm text-white focus:border-cyan-500 outline-none text-center h-[40px]"
                          onWheel={handleNumberWheel}
                        />
                      </td>
                      <td className="px-5 py-1">
                        <CustomAmountInput 
                          value={s.charge}
                          onChange={(e) => updateService(s.id, "charge", e.target.value)}
                          className="w-full bg-[#0a2040] border border-[#1e4270] rounded-lg px-4 text-sm text-white focus:border-cyan-500 outline-none text-right"
                          height="40px"
                          leftAddon={null}
                        />
                      </td>
                      <td className="px-5 py-1 text-center text-sm text-white font-semibold">
                        ${s.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#16375e] border-t border-[#1e4270] sticky bottom-0 z-10 shadow-sm">
                  <tr>
                    <td colSpan={4} className="px-6 py-1 text-right text-xs text-[#808080] font-bold uppercase tracking-widest bg-[#16375e]">
                      Total Service Charge
                    </td>
                    <td className="px-6 py-1 text-center text-lg text-cyan-400 font-bold bg-[#16375e]">
                      ${totalCharge.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Collected (History) */}
          <div className="bg-[#0d2b52] mt-3 -mb-4 border border-[#1e4270] rounded-xl overflow-hidden shadow-sm">
            <div className="p-2 border-b border-[#1e4270] bg-[#16375e]">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Clock size={18} className="text-cyan-500" /> Payment History
              </h4>
            </div>
            <div className="overflow-x-auto max-h-[290px] overflow-y-auto">
              {isLoadingHistory ? (
                <Box p={12} textAlign="center">
                  <Spinner color="cyan.500" />
                </Box>
              ) : (Array.isArray(paymentHistory) ? paymentHistory : paymentHistory?.data || []).length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#16375e] text-[#808080] text-[11px] uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-2 font-semibold bg-[#16375e]">
                        ID
                      </th>
                      <th className="px-5 py-2 font-semibold bg-[#16375e]">
                        Appt Date
                      </th>
                      <th className="px-5 py-2 font-semibold bg-[#16375e]">
                        Appt Time
                      </th>
                      <th className="px-5 py-2 font-semibold bg-[#16375e]">
                        Check#
                      </th>
                      <th className="px-5 py-2 font-semibold bg-[#16375e]">
                        Payment Date
                      </th>
                      <th className="px-5 py-2 font-semibold text-right bg-[#16375e]">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e4270]">
                    {(Array.isArray(paymentHistory) ? paymentHistory : paymentHistory?.data || []).map((payment, idx) => (
                      <tr
                        key={idx}
                        className="group hover:bg-[#0a2040]/50 transition-colors"
                      >
                        <td className="px-5 py-3 text-sm text-white">
                          {payment.payment_id || "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-white">
                          {payment.appt_date || "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-white">
                          {payment.appt_time || "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-white">
                          {payment.check_number || "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-white">
                          {payment.payment_date ? formatDate(payment.payment_date, "MM/dd/yyyy") : "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-white font-semibold text-right">
                          ${payment.payment_amount ? parseFloat(payment.payment_amount).toFixed(2) : "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-16 h-16 bg-[#0a2040] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1e4270]">
                    <FileText size={24} className="text-[#1e4270]" />
                  </div>
                  <p className="text-[#d2d0d0] text-sm font-medium">
                    No previous payments
                  </p>
                  <p className="text-[#808080] text-xs">
                    Previous payments for this visit will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) - Payment Collection Card */}
        <div className="space-y-6 mt-3 sticky top-6">
          <div className="bg-[#0d2b52] border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-2 border-b border-[#1e4270] bg-[#16375e]">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <DollarSign size={18} className="text-cyan-500" /> Collect Payment
              </h4>
            </div>
            <div className="p-5">
              {isSuccess ? (
                <div className="text-center space-y-6 py-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={48} className="text-green-400" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-xl font-bold text-white">Payment Successful</h2>
                    <p className="text-[#808080] text-sm leading-relaxed">
                      Payment of <span className="text-white font-semibold">${parseFloat(paymentAmount).toFixed(2)}</span> has been processed via {paymentMethod}.
                    </p>
                  </div>
                  <CustomButton 
                    className="w-70 mt-2 py-3.5 text-sm font-bold uppercase tracking-wider"
                    onClick={handleMakeNewPayment}
                  >
                    Make New Payment
                  </CustomButton>
                </div>
              ) : (
                <div className="space-y-7">
                  {/* Payment Amount */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2.5">Payment Amount</label>
                    <CustomAmountInput 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#0a2040] border border-[#1e4270] rounded-xl text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-lg font-semibold"
                      height="40px"
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Payment Method</label>
                    <div className="flex flex-row items-center gap-2">
                      {["Cash", "Credit Card", "Check"].map((method) => (
                        <label 
                          key={method} 
                          className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            paymentMethod === method 
                            ? 'bg-cyan-500/5 border-cyan-500 text-white' 
                            : 'bg-[#0a2040] border-[#1e4270] text-[#808080] hover:border-[#2b5187]'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="payment_method" 
                            value={method}
                            checked={paymentMethod === method}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="hidden"
                          />
                          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${
                            paymentMethod === method ? 'border-cyan-500 bg-cyan-500' : 'border-[#2b5187]'
                          }`}>
                            {paymentMethod === method && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Credit Card Details */}
                  {paymentMethod === "Credit Card" && (
                    <div className="space-y-5 pt-4 border-t border-[#1e4270] animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-2">Card Number <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2b5187]" />
                            <input 
                                type="text"
                                value={ccDetails.number}
                                onChange={(e) => setCcDetails({...ccDetails, number: e.target.value})}
                                placeholder="0000 0000 0000 0000"
                                className="w-full bg-[#0a2040] border border-[#1e4270] rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-cyan-500 outline-none transition-all"
                                required
                            />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-2">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-2">Exp Month <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                value={ccDetails.expiryMonth}
                                onChange={(e) => setCcDetails({...ccDetails, expiryMonth: e.target.value})}
                                placeholder="MM"
                                className="w-full bg-[#0a2040] border border-[#1e4270] rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none text-center"
                                maxLength={2}
                                required
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-2">Exp Year <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                value={ccDetails.expiryYear}
                                onChange={(e) => setCcDetails({...ccDetails, expiryYear: e.target.value})}
                                placeholder="YY"
                                className="w-full bg-[#0a2040] border border-[#1e4270] rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none text-center"
                                maxLength={2}
                                required
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-2">CVV <span className="text-red-500">*</span></label>
                            <input 
                                type="password"
                                value={ccDetails.cvv}
                                onChange={(e) => setCcDetails({...ccDetails, cvv: e.target.value})}
                                placeholder="***"
                                className="w-full bg-[#0a2040] border border-[#1e4270] rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none text-center"
                                maxLength={4}
                                required
                            />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CC & Check Specific Options */}
                  {paymentMethod !== "Cash" && (
                    <div className="space-y-4 pt-4 border-t border-[#1e4270] animate-in fade-in slide-in-from-top-2">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={sameAsPatientAddress}
                          onChange={(e) => setSameAsPatientAddress(e.target.checked)}
                          className="w-5 h-5 mt-0.5 rounded border-[#1e4270] text-cyan-500 focus:ring-cyan-500/20 bg-[#0a2040]"
                        />
                        <span className="text-xs text-[#d2d0d0] leading-relaxed group-hover:text-white transition-colors">
                          Billing address is same as patient address
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-2">
                    <CustomButton 
                      variant="outline" 
                      className="flex-1 py-3.5 border-[#1e4270] hover:bg-[#1e4270] text-white"
                      onClick={() => {
                        setPaymentAmount("");
                        setPaymentMethod("Credit Card");
                        setIsNoteActive(false);
                        setDoNotChargeCC(false);
                        setCcDetails({ number: "", expiryMonth: "", expiryYear: "", cvv: "" });
                      }}
                    >
                      Clear
                    </CustomButton>
                    <CustomButton
                      className="flex-1 py-3.5 shadow-lg shadow-cyan-500/20 font-bold"
                      onClick={handleCollectPayment}
                      loading={isPaying}
                      disabled={isPaying}
                    >
                      Collect Payment
                    </CustomButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsHub;
