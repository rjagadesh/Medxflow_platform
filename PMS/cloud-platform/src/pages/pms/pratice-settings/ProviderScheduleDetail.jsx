import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import { Plus, X, Clock, Trash2, Edit } from 'lucide-react';
import CustomButton from "@/components/button/button";

/* ================= STYLES (MUST BE AT TOP) ================= */
const styles = {
  page: {
    backgroundColor: "#1a1a1a",
    minHeight: "100vh",
    padding: "24px",
    color: "#fff",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  providerName: {
    fontSize: "28px",
    fontWeight: "600",
    margin: "0",
  },
  timeSlotsLabel: {
    display: "flex",
    alignItems: "center",
    color: "#9ca3af",
    fontSize: "18px",
    marginTop: "8px",
  },
  addBtn: {
    backgroundColor: "#2563eb",
    padding: "10px 20px",
  },
    addBtn1: {
    backgroundColor: "#fff",
    padding: "10px 16px",
  },

  tableContainer: {
    backgroundColor: "#2d2d2d",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #404040",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    backgroundColor: "#1f2937",
    fontSize: "13px",
    textTransform: "uppercase",
    color: "#9ca3af",
    borderBottom: "1px solid #404040",
  },
  tr: {
    borderBottom: "1px solid #404040",
  },
  td: {
    padding: "16px",
    fontSize: "14px",
  },
  emptyTd: {
    textAlign: "center",
    padding: "40px",
    color: "#9ca3af",
    fontSize: "15px",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    marginRight: "12px",
    color: "#9ca3af",
    padding: "4px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#2d2d2d",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "600px",
    border: "1px solid #404040",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #404040",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  modalBody: {
    padding: "24px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    color: "#d1d5db",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    color: "#d1d5db",
    cursor: "pointer",
    marginTop: "8px",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "20px 24px",
    borderTop: "1px solid #404040",
    backgroundColor: "#1f2937",
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid #404040",
    color: "#fff",
    padding: "8px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  saveBtn: {
    background: "#2563eb",
    border: "none",
    color: "#fff",
    padding: "8px 24px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

const ProviderScheduleDetail = () => {
  const { id:providerId } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [locations, setLocations] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    start_date: '',
    from_time: '',
    to_time: '',
    custom_text: '',
    block_appointments: false,
  });

  /* ================= FETCH DATA ================= */
  const fetchLocations = async () => {
    try {
      const response = await apiRequest(apiRoutes.serviceLocation.list);
      const data = response?.data ?? response;

      if (Array.isArray(data)) setLocations(data);
      else if (Array.isArray(data?.results)) setLocations(data.results);
      else setLocations([]);
    } catch (err) {
      console.error("Failed to fetch locations", err);
      setLocations([]);
    }
  };
 
  useEffect(() => {
      fetchLocations();
    }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch provider details
      const providerRes = await apiRequest(apiRoutes.provider.getById, {  
          metadata: { id: providerId },    
      });
      console.log("Provider Res:", providerRes);  
      setProvider(providerRes);

      // Fetch all schedule blocks
      const blocksRes = await apiRequest(apiRoutes.provider_schedule.get);
      console.log("Blocks Res:", blocksRes);
      // Filter blocks for this provider
      const providerBlocks = blocksRes.blocks.filter(
        (block) => block.provider === parseInt(providerId) || block.provider?.id === parseInt(providerId)
      );
      setBlocks(providerBlocks);
    } catch (err) {
      console.error("Error loading data:", err);
      alert("Failed to load provider schedule.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    
    console.log("Fetching data for providerId:", providerId);

    if (providerId) fetchData();
  }, [providerId]);

  /* ================= SAVE (CREATE / UPDATE) ================= */
  const handleSave = async () => {
    if (!formData.name || !formData.start_date || !formData.from_time || !formData.to_time) {
      alert("Please fill all required fields: Name, Date, From Time, To Time.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        provider: parseInt(providerId),
        name: formData.name.trim(),
        color: formData.color,
        start_date: formData.start_date,
        from_time: formData.from_time,
        to_time: formData.to_time,
        custom_text: formData.custom_text.trim() || null,
        block_appointments: formData.block_appointments,
      };

      let updatedBlock;
      console.log("Saving block with payload:", editingBlock);
      if (editingBlock) {
        
        // UPDATE
        updatedBlock = await apiRequest(apiRoutes.provider_schedule.update, {
          payload,
          metadata: { id: editingBlock.id },
        });
        setBlocks(blocks.map(b => b.id === editingBlock.id ? updatedBlock : b));
      } else {
        // CREATE
        updatedBlock = await apiRequest(apiRoutes.provider_schedule.create,
            {payload});
        setBlocks([...blocks, updatedBlock]);
      }

      closeModal();
    } catch (err) {
      console.error(err);
      alert("Failed to save time slot.");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (blockId) => {
    if (!window.confirm("Are you sure you want to delete this time slot?")) return;

    try {
      await apiRequest(apiRoutes.provider_schedule.delete, {
        metadata: { id: blockId },
      });
      setBlocks(blocks.filter(b => b.id !== blockId));
    } catch (err) {
      alert("Failed to delete time slot.");
    }
  };

  /* ================= MODAL CONTROLS ================= */
  const openCreateModal = () => {
    setEditingBlock(null);
    setFormData({
      name: '',
      color: '#3B82F6',
      start_date: '',
      from_time: '',
      to_time: '',
      custom_text: '',
      block_appointments: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (block) => {
    setEditingBlock(block);
    setFormData({
      name: block.name,
      color: block.color,
      start_date: block.start_date,
      from_time: block.from_time,
      to_time: block.to_time,
      custom_text: block.custom_text || '',
      block_appointments: block.block_appointments,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBlock(null);
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>
            Loading provider schedule...
          </p>
        </div>
      </div>
    );
  }

  if (!provider) return null;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.providerName}>
              {provider.first_name} {provider.last_name}
            </h1>
            <p style={styles.timeSlotsLabel}>
              <Clock size={22} style={{ marginRight: "8px" }} />
              Time Slots
            </p>
          </div>

          <CustomButton
            onClick={openCreateModal}
            style={styles.addBtn1}
            leftIcon={<Plus size={20} />}
          >
            Add Time Slot
          </CustomButton>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Time Slot</th>
                <th style={styles.th}>Custom Text</th>
                <th style={styles.th}>Block Appts</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.emptyTd}>
                    No time slots defined yet
                  </td>
                </tr>
              ) : (
                blocks.map((block) => (
                  <tr key={block.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "16px", height: "16px", backgroundColor: block.color, borderRadius: "4px" }} />
                        {block.name}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {block.start_date} | {block.from_time} - {block.to_time}
                    </td>
                    <td style={styles.td}>{block.custom_text || '-'}</td>
                    <td style={styles.td}>{block.block_appointments ? 'Yes' : 'No'}</td>
                    <td style={styles.td}>
                      <button onClick={() => openEditModal(block)} style={styles.iconBtn}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(block.id)} style={{ ...styles.iconBtn, color: "#ef4444" }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
                  {editingBlock ? "Edit" : "Add"} Time Slot
                </h2>
                <button onClick={closeModal} style={styles.closeBtn}>
                  <X size={24} />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.input}
                    placeholder="e.g., Morning Clinic"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{ ...styles.input, height: "50px", padding: "4px" }}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.row}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>From Time *</label>
                    <input
                      type="time"
                      value={formData.from_time}
                      onChange={(e) => setFormData({ ...formData, from_time: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>To Time *</label>
                    <input
                      type="time"
                      value={formData.to_time}
                      onChange={(e) => setFormData({ ...formData, to_time: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Custom Text (optional)</label>
                  <input
                    type="text"
                    value={formData.custom_text}
                    onChange={(e) => setFormData({ ...formData, custom_text: e.target.value })}
                    style={styles.input}
                    placeholder="e.g., Lunch break"
                  />
                </div>
                <div>
                        <label style={styles.label}>Service Location</label>
                  <select
                    value={formData.service_location_id}
                    onChange={(e) => setFormData({ ...formData, service_location_id: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">Select a location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                      </select>
                </div>




                <div style={styles.formGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.block_appointments}
                      onChange={(e) => setFormData({ ...formData, block_appointments: e.target.checked })}
                      style={{ marginRight: "10px", accentColor: "#2563eb" }}
                    />
                    Block appointments during this time
                  </label>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button style={styles.cancelBtn} onClick={closeModal}>
                  Cancel
                </button>
                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : (editingBlock ? "Update" : "Save")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderScheduleDetail;