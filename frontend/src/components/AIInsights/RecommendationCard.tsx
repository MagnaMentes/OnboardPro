import {
  AIRecommendation,
  RecommendationPriority,
  RecommendationStatus,
  InsightTag,
} from "@/types/aiInsights";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Button,
  Text,
  HStack,
  VStack,
  Box,
  Tag,
  TagLeftIcon,
  TagLabel,
  Tooltip,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  FiClock,
  FiTag,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiMoreVertical,
  FiExternalLink,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useState } from "react";

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  onAccept?: (id: number, reason?: string) => void;
  onReject?: (id: number, reason?: string) => void;
}

const RecommendationCard = ({
  recommendation,
  onAccept,
  onReject,
}: RecommendationCardProps) => {
  // State для модальных окон принятия/отклонения
  const [reason, setReason] = useState("");
  const {
    isOpen: isAcceptOpen,
    onOpen: onAcceptOpen,
    onClose: onAcceptClose,
  } = useDisclosure();
  const {
    isOpen: isRejectOpen,
    onOpen: onRejectOpen,
    onClose: onRejectClose,
  } = useDisclosure();

  // Определение цвета карточки в зависимости от приоритета
  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case RecommendationPriority.HIGH:
        return "red.500";
      case RecommendationPriority.MEDIUM:
        return "orange.500";
      default:
        return "blue.500";
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ru });
  };

  // Обработчики для принятия/отклонения
  const handleAccept = () => {
    if (onAccept) {
      onAccept(recommendation.id, reason || undefined);
      setReason("");
      onAcceptClose();
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(recommendation.id, reason || undefined);
      setReason("");
      onRejectClose();
    }
  };

  return (
    <>
      <Card
        borderLeft="4px"
        borderLeftColor={getPriorityColor()}
        overflow="hidden"
        variant="outline"
        mb={4}
      >
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center">
            <Text fontWeight="bold" fontSize="md">
              {recommendation.title}
            </Text>

            <HStack>
              <Badge
                colorScheme={
                  recommendation.priority === RecommendationPriority.HIGH
                    ? "red"
                    : recommendation.priority === RecommendationPriority.MEDIUM
                    ? "orange"
                    : "blue"
                }
              >
                {recommendation.priority_display}
              </Badge>
              <Badge
                colorScheme={
                  recommendation.status === RecommendationStatus.ACCEPTED
                    ? "green"
                    : recommendation.status === RecommendationStatus.REJECTED
                    ? "red"
                    : recommendation.status === RecommendationStatus.EXPIRED
                    ? "gray"
                    : "orange"
                }
              >
                {recommendation.status_display}
              </Badge>

              {/* Меню действий */}
              <Menu>
                <MenuButton as={Button} size="sm" variant="ghost">
                  <Icon as={FiMoreVertical} />
                </MenuButton>
                <MenuList>
                  {onAccept &&
                    recommendation.status === RecommendationStatus.ACTIVE && (
                      <MenuItem icon={<FiCheckCircle />} onClick={onAcceptOpen}>
                        Принять
                      </MenuItem>
                    )}
                  {onReject &&
                    recommendation.status === RecommendationStatus.ACTIVE && (
                      <MenuItem icon={<FiXCircle />} onClick={onRejectOpen}>
                        Отклонить
                      </MenuItem>
                    )}
                  <MenuItem
                    icon={<FiExternalLink />}
                    as={Link}
                    to={`/admin/ai/recommendations/${recommendation.id}`}
                  >
                    Перейти к деталям
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </CardHeader>

        <CardBody py={2}>
          <Text fontSize="sm" mb={2}>
            {recommendation.recommendation_text}
          </Text>

          {/* Причина рекомендации, если есть */}
          {recommendation.reason && (
            <Box bg="gray.50" p={2} borderRadius="md" mb={2}>
              <Text fontSize="xs" fontWeight="bold">
                Причина:
              </Text>
              <Text fontSize="xs">{recommendation.reason}</Text>
            </Box>
          )}

          {/* Информация о влиянии, если есть */}
          {recommendation.impact_description && (
            <Box bg="blue.50" p={2} borderRadius="md" mb={2}>
              <Text fontSize="xs" fontWeight="bold">
                Эффект:
              </Text>
              <Text fontSize="xs">{recommendation.impact_description}</Text>
            </Box>
          )}

          {/* Информация о пользователе */}
          {recommendation.user && (
            <Flex alignItems="center" mb={1}>
              <Text fontSize="xs" fontWeight="bold" mr={1}>
                Пользователь:
              </Text>
              <Link to={`/admin/users/${recommendation.user.id}`}>
                <Text fontSize="xs" color="blue.500" textDecoration="underline">
                  {`${recommendation.user.first_name} ${recommendation.user.last_name}`.trim() ||
                    recommendation.user.email}
                </Text>
              </Link>
            </Flex>
          )}

          {/* Информация о принятии/отклонении */}
          {recommendation.status === RecommendationStatus.ACCEPTED &&
            recommendation.accepted_reason && (
              <Box bg="green.50" p={2} borderRadius="md" mt={2} mb={2}>
                <Text fontSize="xs" fontWeight="bold">
                  Причина принятия:
                </Text>
                <Text fontSize="xs">{recommendation.accepted_reason}</Text>
              </Box>
            )}

          {recommendation.status === RecommendationStatus.REJECTED &&
            recommendation.rejected_reason && (
              <Box bg="red.50" p={2} borderRadius="md" mt={2} mb={2}>
                <Text fontSize="xs" fontWeight="bold">
                  Причина отклонения:
                </Text>
                <Text fontSize="xs">{recommendation.rejected_reason}</Text>
              </Box>
            )}

          {/* Теги */}
          {recommendation.tags.length > 0 && (
            <Box mb={2}>
              <HStack spacing={2} mt={2}>
                {recommendation.tags.slice(0, 3).map((tag: InsightTag) => (
                  <Tag
                    size="sm"
                    key={tag.id}
                    colorScheme={tag.color}
                    borderRadius="full"
                  >
                    <TagLeftIcon boxSize="12px" as={FiTag} />
                    <TagLabel>{tag.name}</TagLabel>
                  </Tag>
                ))}

                {/* Показываем +N, если тегов больше 3 */}
                {recommendation.tags.length > 3 && (
                  <Tooltip
                    label={recommendation.tags
                      .slice(3)
                      .map((t) => t.name)
                      .join(", ")}
                  >
                    <Tag size="sm" colorScheme="gray" borderRadius="full">
                      +{recommendation.tags.length - 3}
                    </Tag>
                  </Tooltip>
                )}
              </HStack>
            </Box>
          )}
        </CardBody>

        <CardFooter pt={0} justifyContent="space-between" alignItems="center">
          <HStack spacing={2}>
            <Icon as={FiClock} fontSize="xs" />
            <Text fontSize="xs" color="gray.500">
              {formatDate(recommendation.generated_at)}
            </Text>
          </HStack>

          <HStack spacing={2}>
            <Badge fontSize="xx-small" colorScheme="teal">
              {recommendation.recommendation_type_display}
            </Badge>

            {/* Срок действия */}
            {recommendation.expires_at && (
              <Tooltip
                label={`Действительно до: ${formatDate(
                  recommendation.expires_at
                )}`}
              >
                <Badge fontSize="xx-small" colorScheme="gray">
                  срок:{" "}
                  {format(new Date(recommendation.expires_at), "dd.MM", {
                    locale: ru,
                  })}
                </Badge>
              </Tooltip>
            )}
          </HStack>
        </CardFooter>
      </Card>

      {/* Модальное окно для принятия рекомендации */}
      <Modal isOpen={isAcceptOpen} onClose={onAcceptClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Принять рекомендацию</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>{recommendation.recommendation_text}</Text>
            <FormControl>
              <FormLabel>Комментарий (необязательно)</FormLabel>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Опишите, почему вы принимаете эту рекомендацию или какие действия будут предприняты..."
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={handleAccept}>
              Принять
            </Button>
            <Button onClick={onAcceptClose}>Отмена</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Модальное окно для отклонения рекомендации */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Отклонить рекомендацию</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>{recommendation.recommendation_text}</Text>
            <FormControl>
              <FormLabel>Причина отклонения (необязательно)</FormLabel>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Опишите, почему вы отклоняете эту рекомендацию..."
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleReject}>
              Отклонить
            </Button>
            <Button onClick={onRejectClose}>Отмена</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RecommendationCard;
