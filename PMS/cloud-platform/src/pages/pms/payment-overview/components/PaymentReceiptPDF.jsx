import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 15,
    color: "#000000",
  },
  title: {
    fontSize: 24,
    color: "#000000",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  receiptInfo: {
    fontSize: 10,
    color: "#000000",
    textAlign: "center",
    marginTop: 5,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "bold",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 5,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 10,
  },
  label: {
    fontSize: 10,
    color: "#000000",
    fontWeight: "bold",
    width: 150,
    paddingRight: 10,
  },
  value: {
    fontSize: 10,
    color: "#000000",
    flex: 1,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCol1: {
    width: "40%",
    fontSize: 10,
    color: "#000000",
  },
  tableCol2: {
    width: "20%",
    fontSize: 10,
    color: "#000000",
    textAlign: "center",
  },
  tableCol3: {
    width: "20%",
    fontSize: 10,
    color: "#000000",
    textAlign: "right",
  },
  tableCol4: {
    width: "20%",
    fontSize: 10,
    color: "#000000",
    textAlign: "right",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    marginVertical: 15,
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#000000",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    marginRight: 30,
    textTransform: "uppercase",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    width: 100,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 15,
  },
  footerText: {
    marginBottom: 3,
  },
});

const PaymentReceiptPDF = ({ data }) => {
  const {
    patientName,
    paymentId,
    paymentDate,
    paymentMethod,
    amount,
    services = [],
    providerName,
    locationName,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PAYMENT RECEIPT</Text>
          <Text style={styles.receiptInfo}>
            Payment ID#: {paymentId || "N/A"}
          </Text>
          <Text style={styles.receiptInfo}>
            Date: {paymentDate || new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Patient Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Patient Name:</Text>
            <Text style={styles.value}>{patientName}</Text>
          </View>
        </View>

        {/* Visit Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Provider Name:</Text>
            <Text style={styles.value}>{providerName || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{locationName || "N/A"}</Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>{paymentMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={styles.value}>SUCCESSFUL</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Transaction Date:</Text>
            <Text style={styles.value}>
              {paymentDate || new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Services Table */}
        {services.length > 0 && (
          <View style={styles.table}>
            <Text style={styles.sectionTitle}>Services Rendered</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: "40%" }]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderText, { width: "20%", textAlign: "center" }]}>
                Units
              </Text>
              <Text style={[styles.tableHeaderText, { width: "20%", textAlign: "right" }]}>
                Rate
              </Text>
              <Text style={[styles.tableHeaderText, { width: "20%", textAlign: "right" }]}>
                Amount
              </Text>
            </View>
            {services.map((service, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCol1}>
                  {service.service || "General Service"}
                </Text>
                <Text style={styles.tableCol2}>{service.units || 1}</Text>
                <Text style={styles.tableCol3}>
                  ${parseFloat(service.charge || 0).toFixed(2)}
                </Text>
                <Text style={styles.tableCol4}>
                  ${parseFloat(service.total || 0).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Total Amount */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount Paid:</Text>
            <Text style={styles.totalValue}>
              ${parseFloat(amount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your payment.
          </Text>
          <Text style={styles.footerText}>
            This is a computer-generated receipt and does not require a signature.
          </Text>
          <Text style={styles.footerText}>
            Please retain this receipt for your records.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PaymentReceiptPDF;