import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Text,
  Heading,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  Badge,
  Flex,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  Crown,
  Check,
  Zap,
  Star,
  Rocket,
  Award,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Wallet,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  RecruiterSubscriptionInfoResponse,
  RecruiterPlanResponse,
  recruiterSubscriptionService
} from '../../services/recruiterSubscriptionService';
import { QuotaDisplay, FeatureCard, RECRUITER_FEATURES } from './RecruiterQuotaDisplay';
import { premiumService } from '../../services/premiumService';
import { PremiumPlan } from '../../data/premiumDTOs';
import walletService from '../../services/walletService';
import { WalletResponse } from '../../data/walletDTOs';
import LoginRequiredModal from '../auth/LoginRequiredModal';

interface RecruiterPremiumPageProps {
  isEmbedded?: boolean;
}

const RecruiterPremiumPage: React.FC<RecruiterPremiumPageProps> = ({ isEmbedded = false }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [subscriptionInfo, setSubscriptionInfo] = useState<RecruiterSubscriptionInfoResponse | null>(null);
  const [plans, setPlans] = useState<RecruiterPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subInfo, planList, wallet] = await Promise.all([
        recruiterSubscriptionService.getSubscriptionInfo(),
        recruiterSubscriptionService.getPlans(),
        walletService.getMyWallet().catch(() => null)
      ]);
      setSubscriptionInfo(subInfo);
      setPlans(planList);
      setWalletData(wallet);
    } catch (error) {
      console.error('Failed to load recruiter subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planName: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const plan = plans.find(p => p.name === planName);
    if (!plan) return;

    if (walletData && parseFloat(walletData.cashBalance) < parseFloat(String(plan.price))) {
      toast({
        title: 'Số dư ví không đủ',
        description: 'Vui lòng nạp thêm tiền vào ví để mua gói này.',
        status: 'warning',
        duration: 5000,
        isClosable: true
      });
      return;
    }

    try {
      setPurchasing(planName);
      await recruiterSubscriptionService.purchaseWithWallet(plan.id);
      toast({
        title: 'Mua gói thành công!',
        description: `Bạn đã mua gói ${plan.displayName} thành công.`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Mua gói thất bại',
        description: error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPlanIcon = (planName: string) => {
    if (planName.includes('enterprise')) return Crown;
    if (planName.includes('business')) return Star;
    return Rocket;
  };

  const getPlanColor = (planName: string) => {
    if (planName.includes('enterprise')) return 'purple';
    if (planName.includes('business')) return 'blue';
    return 'green';
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="blue.400" />
      </Flex>
    );
  }

  return (
    <>
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để nâng cấp gói"
        message="Bạn cần đăng nhập để mua gói Recruiter Premium"
        feature="Recruiter Premium"
      />

      <Box
        minH="100vh"
        bg="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
        py={8}
      >
      <Container maxW="container.xl">
        {/* Header */}
        <VStack spacing={4} mb={8} textAlign="center">
          <Badge
            colorScheme="purple"
            fontSize="sm"
            px={4}
            py={1}
            borderRadius="full"
          >
            Dành riêng cho Recruiter
          </Badge>
          <Heading
            as="h1"
            size="2xl"
            bgGradient="linear(to-r, blue.400, purple.400)"
            bgClip="text"
          >
            Nâng Cấp Gói Recruiter
          </Heading>
          <Text color="gray.400" fontSize="lg" maxW="600px">
            Tiếp cận ứng viên chất lượng cao, đăng tin không giới hạn
            và nhiều tính năng đặc biệt dành riêng cho nhà tuyển dụng chuyên nghiệp
          </Text>
        </VStack>

        {/* Current Subscription Info */}
        {subscriptionInfo?.hasSubscription && (
          <Box
            mb={8}
            p={6}
            bg="rgba(99, 102, 241, 0.15)"
            borderRadius="xl"
            border="1px solid"
            borderColor="rgba(99, 102, 241, 0.3)"
          >
            <Flex justify="space-between" align="center" mb={6}>
              <HStack spacing={4}>
                <Box
                  p={3}
                  bg="rgba(99, 102, 241, 0.2)"
                  borderRadius="lg"
                >
                  <Icon as={Crown} color="purple.300" boxSize={6} />
                </Box>
                <Box>
                  <Text color="purple.300" fontWeight="bold" fontSize="lg">
                    {subscriptionInfo.planDisplayName}
                  </Text>
                  <HStack spacing={4} color="gray.400" fontSize="sm">
                    <HStack>
                      <Icon as={Calendar} />
                      <Text>Còn {subscriptionInfo.daysRemaining} ngày</Text>
                    </HStack>
                    {subscriptionInfo.autoRenew && (
                      <Badge colorScheme="green">Auto-renew</Badge>
                    )}
                  </HStack>
                </Box>
              </HStack>
              <Button
                colorScheme="purple"
                variant="outline"
                size="sm"
              >
                Quản lý gói
              </Button>
            </Flex>

            {/* Quota Display */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
              <QuotaDisplay
                label="Tin tuyển dụng dài hạn"
                used={subscriptionInfo.jobPostingUsed}
                limit={subscriptionInfo.jobPostingLimit}
                unlimited={subscriptionInfo.jobPostingUnlimited}
                resetInfo={subscriptionInfo.jobPostingResetInfo}
                colorScheme="blue"
              />
              <QuotaDisplay
                label="Tin Gig/Công việc ngắn hạn"
                used={subscriptionInfo.shortTermJobPostingUsed}
                limit={subscriptionInfo.shortTermJobPostingLimit}
                unlimited={subscriptionInfo.shortTermJobPostingUnlimited}
                resetInfo={subscriptionInfo.shortTermJobPostingResetInfo}
                colorScheme="orange"
              />
              <QuotaDisplay
                label="Job Boost"
                used={subscriptionInfo.jobBoostUsed}
                limit={subscriptionInfo.jobBoostLimit}
                unlimited={false}
                resetInfo={subscriptionInfo.jobBoostResetInfo}
                colorScheme="purple"
              />
            </SimpleGrid>

            {/* Features Access */}
            <Text color="gray.300" fontWeight="medium" mb={3}>
              Quyền truy cập tính năng:
            </Text>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
              {RECRUITER_FEATURES.filter(f => f.isFeature).map(feature => {
                const key = feature.key as keyof RecruiterSubscriptionInfoResponse;
                const isEnabled = subscriptionInfo[key] as boolean;
                return (
                  <FeatureCard
                    key={feature.key}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    isEnabled={isEnabled}
                  />
                );
              })}
            </SimpleGrid>
          </Box>
        )}

        {/* No Subscription Alert */}
        {!subscriptionInfo?.hasSubscription && (
          <Alert
            status="info"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            mb={8}
            borderRadius="xl"
            bg="rgba(59, 130, 246, 0.1)"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.3)"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Chưa có gói Recruiter
            </AlertTitle>
            <AlertDescription maxWidth="sm" mb={4}>
              Đăng tin tuyển dụng yêu cầu mua gói Recruiter. Chọn gói phù hợp để bắt đầu tuyển dụng ngay hôm nay!
            </AlertDescription>
          </Alert>
        )}

        {/* Plans */}
        <Tabs variant="soft-rounded" colorScheme="blue" isFitted>
          <TabList mb={6}>
            <Tab
              _selected={{ bg: 'blue.600', color: 'white' }}
              color="gray.400"
            >
              <Icon as={Rocket} mr={2} />
              Gói theo tháng
            </Tab>
            <Tab
              _selected={{ bg: 'purple.600', color: 'white' }}
              color="gray.400"
            >
              <Icon as={Award} mr={2} />
              Gói theo năm
            </Tab>
          </TabList>

          <TabPanels>
            {/* Monthly Plans */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {plans
                  .filter(p => !p.name.includes('yearly'))
                  .map(plan => {
                    const isCurrentPlan = subscriptionInfo?.planName === plan.name;
                    const IconComponent = getPlanIcon(plan.name);
                    const colorScheme = getPlanColor(plan.name);

                    return (
                      <Box
                        key={plan.id}
                        bg="rgba(255, 255, 255, 0.05)"
                        borderRadius="2xl"
                        border="2px solid"
                        borderColor={isCurrentPlan ? `${colorScheme}.400` : 'rgba(255, 255, 255, 0.1)'}
                        overflow="hidden"
                        position="relative"
                        transition="all 0.3s"
                        _hover={{
                          transform: 'translateY(-4px)',
                          borderColor: `${colorScheme}.400`
                        }}
                      >
                        {isCurrentPlan && (
                          <Box
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            bg={`${colorScheme}.500`}
                            py={1}
                            textAlign="center"
                          >
                            <Text fontSize="xs" fontWeight="bold" color="white">
                              ĐANG SỬ DỤNG
                            </Text>
                          </Box>
                        )}

                        <Box p={6} pt={isCurrentPlan ? 10 : 6}>
                          <VStack spacing={4} align="stretch">
                            <HStack>
                              <Box
                                p={2}
                                bg={`${colorScheme}.500`}
                                borderRadius="lg"
                              >
                                <Icon as={IconComponent} color="white" boxSize={5} />
                              </Box>
                              <Text fontWeight="bold" fontSize="lg" color="white">
                                {plan.displayName}
                              </Text>
                            </HStack>

                            <Box>
                              <Text
                                fontSize="4xl"
                                fontWeight="bold"
                                color="white"
                              >
                                {formatPrice(plan.price)}
                              </Text>
                              <Text color="gray.500" fontSize="sm">
                                /tháng
                              </Text>
                            </Box>

                            <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                            <VStack align="stretch" spacing={2}>
                              {JSON.parse(plan.features || '[]').map((feature: string, idx: number) => (
                                <HStack key={idx} spacing={2}>
                                  <Icon as={Check} color="green.400" boxSize={4} />
                                  <Text color="gray.300" fontSize="sm">
                                    {feature}
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>

                            <Button
                              colorScheme={colorScheme}
                              size="lg"
                              w="full"
                              mt={4}
                              isDisabled={isCurrentPlan}
                              isLoading={purchasing === plan.name}
                              loadingText="Đang xử lý..."
                              onClick={() => handlePurchase(plan.name)}
                              rightIcon={!isCurrentPlan ? <ArrowRight /> : undefined}
                            >
                              {isCurrentPlan ? 'Đang sử dụng' : 'Mua ngay'}
                            </Button>
                          </VStack>
                        </Box>
                      </Box>
                    );
                  })}
              </SimpleGrid>
            </TabPanel>

            {/* Yearly Plans */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {plans
                  .filter(p => p.name.includes('yearly'))
                  .map(plan => {
                    const isCurrentPlan = subscriptionInfo?.planName === plan.name;
                    const monthlyPrice = plan.price / 12;
                    const savings = Math.round((1 - monthlyPrice / 249000) * 100);

                    return (
                      <Box
                        key={plan.id}
                        bg="rgba(147, 51, 234, 0.1)"
                        borderRadius="2xl"
                        border="2px solid"
                        borderColor={isCurrentPlan ? 'purple.400' : 'rgba(147, 51, 234, 0.3)'}
                        overflow="hidden"
                        position="relative"
                        transition="all 0.3s"
                        _hover={{
                          transform: 'translateY(-4px)',
                          borderColor: 'purple.400'
                        }}
                      >
                        {isCurrentPlan && (
                          <Box
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            bg="purple.500"
                            py={1}
                            textAlign="center"
                          >
                            <Text fontSize="xs" fontWeight="bold" color="white">
                              ĐANG SỬ DỤNG
                            </Text>
                          </Box>
                        )}

                        <Box
                          position="absolute"
                          top={4}
                          right={4}
                          bg="red.500"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          <Text fontSize="xs" fontWeight="bold" color="white">
                            TIẾT KIỆM {savings}%
                          </Text>
                        </Box>

                        <Box p={6} pt={isCurrentPlan ? 12 : 6}>
                          <VStack spacing={4} align="stretch">
                            <HStack>
                              <Box
                                p={2}
                                bg="purple.500"
                                borderRadius="lg"
                              >
                                <Icon as={Crown} color="white" boxSize={5} />
                              </Box>
                              <Text fontWeight="bold" fontSize="lg" color="white">
                                {plan.displayName}
                              </Text>
                            </HStack>

                            <Box>
                              <Text
                                fontSize="4xl"
                                fontWeight="bold"
                                color="white"
                              >
                                {formatPrice(plan.price)}
                              </Text>
                              <HStack spacing={2}>
                                <Text color="gray.500" fontSize="sm">
                                  /năm
                                </Text>
                                <Text color="purple.300" fontSize="sm">
                                  (chỉ {formatPrice(Math.round(plan.price / 12))}/tháng)
                                </Text>
                              </HStack>
                            </Box>

                            <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                            <VStack align="stretch" spacing={2}>
                              {JSON.parse(plan.features || '[]').map((feature: string, idx: number) => (
                                <HStack key={idx} spacing={2}>
                                  <Icon as={Check} color="green.400" boxSize={4} />
                                  <Text color="gray.300" fontSize="sm">
                                    {feature}
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>

                            <Button
                              colorScheme="purple"
                              size="lg"
                              w="full"
                              mt={4}
                              isDisabled={isCurrentPlan}
                              isLoading={purchasing === plan.name}
                              loadingText="Đang xử lý..."
                              onClick={() => handlePurchase(plan.name)}
                              rightIcon={!isCurrentPlan ? <ArrowRight /> : undefined}
                            >
                              {isCurrentPlan ? 'Đang sử dụng' : 'Mua ngay'}
                            </Button>
                          </VStack>
                        </Box>
                      </Box>
                    );
                  })}
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
      </Box>
    </>
  );
};

export default RecruiterPremiumPage;
