import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAdById, getFileUrl, getUserProfile } from '../../lib/appwrite';
import { useAuthStore } from '../../store/auth.store';
import { useReportsStore } from '../../store/reports.store';

type ReportItem = {
  $id: string;
  $createdAt?: string;
  reason?: string;
  details?: string;
  reporterID?: any;
  adId?: any;
  reporterName?: string;
  reporterProfile?: any;
  ad?: any;
};

const normalizeRelation = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : undefined;
  }
  return value;
};

const getTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Unknown';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return Math.floor(seconds) + 's ago';
};

const ReportsScreen = () => {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { fetchReports } = useReportsStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadReports = async () => {
    try {
      const data = await fetchReports();
      const enriched = await Promise.all(
        (data as ReportItem[]).map(async (report) => {
          const reporterRef = normalizeRelation(report.reporterID);
          const adRef = normalizeRelation(report.adId);
          let reporterName = 'Unknown';
          let reporterProfile = reporterRef;
          let ad = adRef;

          if (reporterRef && typeof reporterRef === 'object') {
            reporterName = reporterRef.name || reporterRef.fullName || reporterRef.email || reporterRef.$id || 'Unknown';
          } else if (typeof reporterRef === 'string') {
            try {
              const profile = await getUserProfile(reporterRef);
              reporterProfile = profile;
              reporterName = profile?.name || profile?.email || profile?.user_id || 'Unknown';
            } catch (error) {
              reporterName = reporterRef;
            }
          }

          if (adRef && typeof adRef === 'string') {
            try {
              ad = await getAdById(adRef);
            } catch (error) {
              ad = undefined;
            }
          }

          return {
            ...report,
            reporterName,
            reporterProfile,
            ad
          };
        })
      );
      setReports(enriched);
    } catch (error) {
      setReports([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    loadReports();
  }, [isAuthLoading, isAdmin]);

  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      router.replace('/(tabs)');
    }
  }, [isAuthLoading, isAdmin, router]);

  const onRefresh = async () => {
    if (!isAdmin) return;
    setRefreshing(true);
    await loadReports();
  };

  const openReport = (report: ReportItem) => {
    setSelectedReport(report);
    setIsModalVisible(true);
  };

  const getReportAdId = (report?: ReportItem) => {
    if (!report) return undefined;
    const adObject = report.ad;
    if (adObject && typeof adObject === 'object') {
      return adObject.$id || adObject.id;
    }
    const adRef = normalizeRelation(report.adId);
    if (typeof adRef === 'string') return adRef;
    if (adRef && typeof adRef === 'object') return adRef.$id || adRef.id;
    return undefined;
  };

  const handleOpenAd = () => {
    const adId = getReportAdId(selectedReport ?? undefined);
    if (!adId) return;
    setIsModalVisible(false);
    router.push({ pathname: '/(tabs)/showAds', params: { id: adId } });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9F7E8]">
      <View className="px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#064229" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#064229]">Reports</Text>
        <View className="w-10 h-10" />
      </View>

      {isAuthLoading || isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#064229" />
        </View>
      ) : !isAdmin ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 border border-red-100 w-full">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[#064229] font-bold">Admins only</Text>
                <Text className="text-[#064229]/50 text-xs">You don’t have access to reports.</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#064229']} />
          }
        >
          {reports.length === 0 ? (
            <View className="bg-white rounded-3xl p-5 border border-red-100">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                  <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[#064229] font-bold">No reports yet</Text>
                  <Text className="text-[#064229]/50 text-xs">Reports will appear here for review.</Text>
                </View>
              </View>
            </View>
          ) : (
            reports.map((report) => (
              <TouchableOpacity
                key={report.$id}
                onPress={() => openReport(report)}
                activeOpacity={0.8}
                className="bg-white rounded-3xl p-5 border border-red-100 mb-4"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                      <Ionicons name="notifications-outline" size={20} color="#dc2626" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-[#064229] font-bold" numberOfLines={1}>
                        {report.reason || 'Report'}
                      </Text>
                      <Text className="text-[#064229]/50 text-xs" numberOfLines={1}>
                        Reporter: {report.reporterName || 'Unknown'}
                      </Text>
                      <Text className="text-[#064229]/50 text-xs" numberOfLines={1}>
                        Ad: {report.ad?.title || 'Unknown Ad'}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end ml-3">
                    <View className="bg-red-50 px-2 py-1 rounded-full mb-2">
                      <Text className="text-[10px] font-semibold text-red-600">
                        {getTimeAgo(report.$createdAt)}
                      </Text>
                    </View>
                    {report.ad?.images?.[0] ? (
                      <Image
                        source={{ uri: getFileUrl(report.ad.images[0]) || undefined }}
                        style={{ width: 54, height: 54, borderRadius: 14 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-[54px] h-[54px] rounded-2xl bg-gray-100 items-center justify-center">
                        <Ionicons name="image-outline" size={20} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-t-[40px] p-6">
                <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 mr-4">
                    <Text className="text-2xl font-bold text-[#064229]">Report Details</Text>
                    <Text className="text-[#064229]/60 text-sm">
                      {getTimeAgo(selectedReport?.$createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsModalVisible(false)}
                    className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={20} color="#064229" />
                  </TouchableOpacity>
                </View>

                <View className="bg-[#F9F7E8] p-4 rounded-2xl mb-4">
                  <Text className="text-[#064229]/60 text-xs font-bold uppercase tracking-wider">Reason</Text>
                  <Text className="text-[#064229] font-semibold mt-1">
                    {selectedReport?.reason || 'No reason provided'}
                  </Text>
                </View>

                <View className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100">
                  <Text className="text-[#064229]/60 text-xs font-bold uppercase tracking-wider">Details</Text>
                  <Text className="text-[#064229] mt-1">
                    {selectedReport?.details?.trim() || 'No extra details provided.'}
                  </Text>
                </View>

                <View className="bg-white border border-gray-100 rounded-2xl p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-[#064229]/60 text-xs font-bold uppercase tracking-wider">Reporter</Text>
                    <Text className="text-[#064229] font-semibold">
                      {selectedReport?.reporterName || 'Unknown'}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[#064229]/60 text-xs font-bold uppercase tracking-wider">Ad</Text>
                    <Text className="text-[#064229] font-semibold" numberOfLines={1}>
                      {selectedReport?.ad?.title || 'Unknown Ad'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleOpenAd}
                  activeOpacity={0.8}
                  className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mt-4"
                >
                  <View className="flex-row items-center">
                    {selectedReport?.ad?.images?.[0] ? (
                      <Image
                        source={{ uri: getFileUrl(selectedReport.ad.images[0]) || undefined }}
                        style={{ width: 70, height: 70, borderRadius: 16 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-[70px] h-[70px] rounded-2xl bg-gray-100 items-center justify-center">
                        <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                      </View>
                    )}
                    <View className="ml-4 flex-1">
                      <Text className="text-[#064229] font-bold" numberOfLines={2}>
                        {selectedReport?.ad?.title || 'Unknown Ad'}
                      </Text>
                      {typeof selectedReport?.ad?.price === 'number' && (
                        <Text className="text-[#064229] font-semibold mt-1">
                          ${selectedReport.ad.price.toFixed(2)}
                        </Text>
                      )}
                      {(selectedReport?.ad?.city || selectedReport?.ad?.country) && (
                        <Text className="text-[#064229]/50 text-xs mt-1" numberOfLines={1}>
                          {selectedReport?.ad?.city || 'Unknown'}, {selectedReport?.ad?.country || 'Unknown'}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default ReportsScreen;
