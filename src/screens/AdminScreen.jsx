import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import apiClient from '../api/client';

export default function AdminScreen() {
  const [pending, setPending] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPending = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/admin/pending-users');
      setPending(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load pending users');
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPending();
    setRefreshing(false);
  };

  const approve = async (id) => {
    try {
      await apiClient.put(`/api/admin/users/${id}/approve`);
      setPending((prev) => prev.filter((u) => u.id !== id));
    } catch {
      Alert.alert('Error', 'Approval failed');
    }
  };

  const reject = async (id) => {
    try {
      await apiClient.delete(`/api/admin/users/${id}/reject`);
      setPending((prev) => prev.filter((u) => u.id !== id));
    } catch {
      Alert.alert('Error', 'Rejection failed');
    }
  };

  return (
    <FlatList
      style={styles.container}
      data={pending}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.empty}>No pending users</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.email} · {item.role} · {item.department}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => approve(item.id)}>
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => reject(item.id)}>
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, elevation: 2 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666', marginTop: 2, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  approveBtn: { backgroundColor: '#2e7d32' },
  rejectBtn: { backgroundColor: '#c62828' },
  btnText: { color: '#fff', fontWeight: '600' },
});