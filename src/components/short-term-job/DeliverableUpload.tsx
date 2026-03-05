import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Text,
  Textarea,
  VStack,
  Badge,
  Flex,
  Spacer,
  Image,
  Link,
  Separator,
  Alert,
  Progress,
} from "@chakra-ui/react";
import {
  FiFile,
  FiImage,
  FiVideo,
  FiLink,
  FiCode,
  FiTrash2,
  FiUpload,
  FiDownload,
  FiPlus,
  FiSend,
  FiEye,
  FiFileText,
} from "react-icons/fi";
import {
  DeliverableType,
  Deliverable,
  SubmitDeliverableRequest,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";

// ==================== TYPES ====================

export interface DeliverableUploadProps {
  applicationId: number;
  existingDeliverables?: Deliverable[];
  allowedTypes?: DeliverableType[];
  maxFiles?: number;
  maxFileSize?: number; // MB
  onSubmit: (request: SubmitDeliverableRequest) => Promise<void>;
  isLoading?: boolean;
  isFinalSubmission?: boolean;
}

interface DeliverableFile {
  id: string;
  type: DeliverableType;
  fileName: string;
  fileUrl: string;
  description: string;
  file?: File;
  isNew: boolean;
}

// ==================== CONSTANTS ====================

const DELIVERABLE_TYPE_CONFIG: Record<
  DeliverableType,
  { icon: any; label: string; accept: string }
> = {
  [DeliverableType.FILE]: {
    icon: FiFile,
    label: "Tệp tin",
    accept: "*/*",
  },
  [DeliverableType.IMAGE]: {
    icon: FiImage,
    label: "Hình ảnh",
    accept: "image/*",
  },
  [DeliverableType.VIDEO]: {
    icon: FiVideo,
    label: "Video",
    accept: "video/*",
  },
  [DeliverableType.DOCUMENT]: {
    icon: FiFileText,
    label: "Tài liệu",
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  },
  [DeliverableType.LINK]: {
    icon: FiLink,
    label: "Đường dẫn",
    accept: "",
  },
  [DeliverableType.CODE]: {
    icon: FiCode,
    label: "Mã nguồn",
    accept: ".zip,.rar,.tar,.gz,.js,.ts,.py,.java,.cpp,.cs,.html,.css",
  },
  [DeliverableType.OTHER]: {
    icon: FiFile,
    label: "Khác",
    accept: "*/*",
  },
};

// ==================== HELPER FUNCTIONS ====================

const getDeliverableTypeFromFile = (file: File): DeliverableType => {
  const type = file.type;
  if (type.startsWith("image/")) return DeliverableType.IMAGE;
  if (type.startsWith("video/")) return DeliverableType.VIDEO;
  if (
    type.includes("pdf") ||
    type.includes("document") ||
    type.includes("spreadsheet") ||
    type.includes("presentation")
  ) {
    return DeliverableType.DOCUMENT;
  }
  if (
    file.name.endsWith(".zip") ||
    file.name.endsWith(".js") ||
    file.name.endsWith(".ts") ||
    file.name.endsWith(".py")
  ) {
    return DeliverableType.CODE;
  }
  return DeliverableType.FILE;
};

// ==================== DELIVERABLE UPLOAD COMPONENT ====================

export const DeliverableUpload: React.FC<DeliverableUploadProps> = ({
  applicationId,
  existingDeliverables = [],
  allowedTypes = Object.values(DeliverableType),
  maxFiles = 10,
  maxFileSize = 50,
  onSubmit,
  isLoading = false,
  isFinalSubmission = false,
}) => {
  const { showError, showWarning } = useToast();

  const [deliverables, setDeliverables] = useState<DeliverableFile[]>(
    existingDeliverables.map((d) => ({
      id: String(d.id),
      type: d.type,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      description: d.description || "",
      isNew: false,
    })),
  );
  const [note, setNote] = useState("");
  const [linkInput, setLinkInput] = useState({ url: "", description: "" });

  // ========== HANDLERS ==========
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: DeliverableFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (deliverables.length + newFiles.length >= maxFiles) {
        errors.push(`Đã đạt giới hạn ${maxFiles} tệp`);
        return;
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name} vượt quá ${maxFileSize}MB`);
        return;
      }

      const detectedType = getDeliverableTypeFromFile(file);
      if (!allowedTypes.includes(detectedType)) {
        errors.push(`${file.name}: loại tệp không được phép`);
        return;
      }

      newFiles.push({
        id: `new-${Date.now()}-${Math.random()}`,
        type: detectedType,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        description: "",
        file: file,
        isNew: true,
      });
    });

    if (errors.length > 0) {
      showWarning("Cảnh báo", errors.join("; "));
    }

    if (newFiles.length > 0) {
      setDeliverables((prev) => [...prev, ...newFiles]);
    }

    e.target.value = "";
  };

  const handleAddLink = () => {
    if (!linkInput.url.trim()) {
      showError("Lỗi", "Vui lòng nhập đường dẫn");
      return;
    }

    try {
      new URL(linkInput.url);
    } catch {
      showError("Lỗi", "Đường dẫn không hợp lệ");
      return;
    }

    setDeliverables((prev) => [
      ...prev,
      {
        id: `link-${Date.now()}`,
        type: DeliverableType.LINK,
        fileName: linkInput.url,
        fileUrl: linkInput.url,
        description: linkInput.description,
        isNew: true,
      },
    ]);

    setLinkInput({ url: "", description: "" });
  };

  const handleUpdateDescription = (id: string, description: string) => {
    setDeliverables((prev) =>
      prev.map((d) => (d.id === id ? { ...d, description } : d)),
    );
  };

  const handleRemoveDeliverable = (id: string) => {
    setDeliverables((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async () => {
    if (deliverables.length === 0) {
      showError("Lỗi", "Vui lòng tải lên ít nhất 1 sản phẩm");
      return;
    }

    // Separate files and links
    const fileDeliverables = deliverables.filter(
      (d) => d.type !== DeliverableType.LINK && d.file,
    );
    const linkDeliverables = deliverables.filter(
      (d) => d.type === DeliverableType.LINK,
    );

    const request: SubmitDeliverableRequest = {
      applicationId,
      files: fileDeliverables.map((d) => d.file).filter(Boolean) as File[],
      links: linkDeliverables.map((d) => d.fileUrl),
      workNote: note.trim() || undefined,
      isFinalSubmission,
    };

    await onSubmit(request);
  };

  // ========== RENDER ==========
  return (
    <VStack gap={4} align="stretch">
      {/* Upload Area */}
      <Card.Root>
        <Card.Header>
          <Heading size="md">
            {isFinalSubmission ? "Nộp sản phẩm cuối cùng" : "Tải lên sản phẩm"}
          </Heading>
        </Card.Header>
        <Card.Body>
          {/* File Upload */}
          <Box
            border="2px dashed"
            borderColor="gray.200"
            borderRadius="md"
            p={6}
            textAlign="center"
            _hover={{ borderColor: "blue.400", bg: "blue.50" }}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Icon boxSize={8} color="gray.400" mb={2}>
              <FiUpload />
            </Icon>
            <Text fontWeight="bold" mb={1}>
              Kéo thả hoặc click để tải lên
            </Text>
            <Text fontSize="sm" color="gray.500">
              Hỗ trợ: Hình ảnh, Video, Tài liệu, Mã nguồn (tối đa {maxFileSize}
              MB/tệp)
            </Text>
            <Input
              id="file-upload"
              type="file"
              multiple
              display="none"
              onChange={handleFileSelect}
            />
          </Box>

          {/* Or Add Link */}
          <Separator my={4} />
          <Text fontWeight="bold" mb={2}>
            Hoặc thêm đường dẫn
          </Text>
          <HStack>
            <Input
              placeholder="https://..."
              value={linkInput.url}
              onChange={(e) =>
                setLinkInput((prev) => ({ ...prev, url: e.target.value }))
              }
            />
            <Input
              placeholder="Mô tả (tùy chọn)"
              value={linkInput.description}
              onChange={(e) =>
                setLinkInput((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <Button onClick={handleAddLink}>
              <FiPlus />
              Thêm
            </Button>
          </HStack>
        </Card.Body>
      </Card.Root>

      {/* Deliverables List */}
      {deliverables.length > 0 && (
        <Card.Root>
          <Card.Header>
            <Flex>
              <Heading size="md">
                Sản phẩm đã tải ({deliverables.length}/{maxFiles})
              </Heading>
              <Spacer />
              <Badge
                colorPalette={deliverables.length >= maxFiles ? "red" : "green"}
              >
                {maxFiles - deliverables.length} còn lại
              </Badge>
            </Flex>
          </Card.Header>
          <Card.Body>
            <VStack gap={3}>
              {deliverables.map((deliverable) => (
                <DeliverableItem
                  key={deliverable.id}
                  deliverable={deliverable}
                  onUpdateDescription={(desc) =>
                    handleUpdateDescription(deliverable.id, desc)
                  }
                  onRemove={() => handleRemoveDeliverable(deliverable.id)}
                />
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Note */}
      <Card.Root>
        <Card.Header>
          <Heading size="md">Ghi chú cho nhà tuyển dụng</Heading>
        </Card.Header>
        <Card.Body>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Giải thích về sản phẩm, hướng dẫn sử dụng, lưu ý..."
            rows={4}
          />
        </Card.Body>
      </Card.Root>

      {/* Warning for Final Submission */}
      {isFinalSubmission && (
        <Alert.Root status="warning" borderRadius="md">
          <Alert.Indicator />
          <Box>
            <Text fontWeight="bold">Lưu ý: Đây là lần nộp cuối cùng</Text>
            <Text fontSize="sm">
              Sau khi nộp, bạn sẽ không thể chỉnh sửa nếu nhà tuyển dụng không
              yêu cầu.
            </Text>
          </Box>
        </Alert.Root>
      )}

      {/* Submit Button */}
      <HStack justify="flex-end">
        <Button
          colorPalette="blue"
          size="lg"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={deliverables.length === 0}
        >
          <FiSend />
          {isFinalSubmission ? "Nộp sản phẩm cuối cùng" : "Lưu & Nộp sản phẩm"}
        </Button>
      </HStack>
    </VStack>
  );
};

// ==================== DELIVERABLE ITEM COMPONENT ====================

interface DeliverableItemProps {
  deliverable: DeliverableFile;
  progress?: number;
  onUpdateDescription: (description: string) => void;
  onRemove: () => void;
}

const DeliverableItem: React.FC<DeliverableItemProps> = ({
  deliverable,
  progress,
  onUpdateDescription,
  onRemove,
}) => {
  const config = DELIVERABLE_TYPE_CONFIG[deliverable.type];

  const renderPreview = () => {
    switch (deliverable.type) {
      case DeliverableType.IMAGE:
        return (
          <Image
            src={deliverable.fileUrl}
            alt={deliverable.fileName}
            maxH="80px"
            objectFit="cover"
            borderRadius="md"
          />
        );
      case DeliverableType.LINK:
        return (
          <Link
            href={deliverable.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            color="blue.500"
          >
            <HStack>
              <Icon>
                <FiLink />
              </Icon>
              <Text lineClamp={1}>{deliverable.fileUrl}</Text>
            </HStack>
          </Link>
        );
      default:
        return (
          <HStack>
            <Icon boxSize={8} color="gray.500">
              <config.icon />
            </Icon>
            <VStack align="start" gap={0}>
              <Text fontWeight="bold" lineClamp={1}>
                {deliverable.fileName}
              </Text>
              <Badge colorPalette="gray" size="sm">
                {config.label}
              </Badge>
            </VStack>
          </HStack>
        );
    }
  };

  return (
    <Card.Root w="100%" variant="outline">
      <Card.Body py={3}>
        <Flex align="center" gap={4}>
          <Box minW="150px">{renderPreview()}</Box>

          <Input
            flex="1"
            placeholder="Mô tả sản phẩm..."
            value={deliverable.description}
            onChange={(e) => onUpdateDescription(e.target.value)}
            size="sm"
          />

          <HStack>
            {deliverable.type !== DeliverableType.LINK && (
              <IconButton
                aria-label="Tải xuống"
                size="sm"
                variant="ghost"
                asChild
              >
                <a href={deliverable.fileUrl} download={deliverable.fileName}>
                  <FiDownload />
                </a>
              </IconButton>
            )}
            {deliverable.type !== DeliverableType.LINK && (
              <IconButton aria-label="Xem" size="sm" variant="ghost" asChild>
                <a
                  href={deliverable.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiEye />
                </a>
              </IconButton>
            )}
            <IconButton
              aria-label="Xóa"
              size="sm"
              colorPalette="red"
              variant="ghost"
              onClick={onRemove}
            >
              <FiTrash2 />
            </IconButton>
          </HStack>
        </Flex>

        {progress !== undefined && progress < 100 && (
          <Progress.Root value={progress} size="xs" colorPalette="blue" mt={2}>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        )}

        {deliverable.isNew && (
          <Badge colorPalette="green" mt={2} size="sm">
            Mới thêm
          </Badge>
        )}
      </Card.Body>
    </Card.Root>
  );
};

// ==================== DELIVERABLE DISPLAY COMPONENT ====================

interface DeliverableDisplayProps {
  deliverables: Deliverable[];
  showDownload?: boolean;
  columns?: 1 | 2 | 3;
}

export const DeliverableDisplay: React.FC<DeliverableDisplayProps> = ({
  deliverables,
  showDownload = true,
  columns = 2,
}) => {
  if (!deliverables || deliverables.length === 0) {
    return (
      <Box textAlign="center" py={6}>
        <Icon boxSize={10} color="gray.400" mb={2}>
          <FiFile />
        </Icon>
        <Text color="gray.500">Chưa có sản phẩm nào</Text>
      </Box>
    );
  }

  const gridColumns = {
    1: { base: "repeat(1, 1fr)" },
    2: { base: "repeat(1, 1fr)", md: "repeat(2, 1fr)" },
    3: {
      base: "repeat(1, 1fr)",
      md: "repeat(2, 1fr)",
      lg: "repeat(3, 1fr)",
    },
  };

  return (
    <Box display="grid" gridTemplateColumns={gridColumns[columns]} gap={4}>
      {deliverables.map((deliverable) => {
        const config =
          DELIVERABLE_TYPE_CONFIG[deliverable.type as DeliverableType];

        return (
          <Card.Root key={deliverable.id}>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                {deliverable.type === DeliverableType.IMAGE ? (
                  <Image
                    src={deliverable.fileUrl}
                    alt={deliverable.fileName}
                    maxH="200px"
                    objectFit="contain"
                    borderRadius="md"
                  />
                ) : deliverable.type === DeliverableType.LINK ? (
                  <Link
                    href={deliverable.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="blue.500"
                  >
                    <HStack>
                      <Icon>
                        <FiLink />
                      </Icon>
                      <Text lineClamp={2}>{deliverable.fileUrl}</Text>
                    </HStack>
                  </Link>
                ) : (
                  <HStack p={4} bg="gray.50" borderRadius="md">
                    <Icon boxSize={10} color="gray.500">
                      {config && <config.icon />}
                    </Icon>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold" lineClamp={1}>
                        {deliverable.fileName}
                      </Text>
                      <Badge colorPalette="gray">
                        {config?.label || "Tệp"}
                      </Badge>
                    </VStack>
                  </HStack>
                )}

                {deliverable.description && (
                  <Text fontSize="sm" color="gray.600">
                    {deliverable.description}
                  </Text>
                )}

                {showDownload && deliverable.type !== DeliverableType.LINK && (
                  <HStack>
                    <Button size="sm" asChild>
                      <a
                        href={deliverable.fileUrl}
                        download={deliverable.fileName}
                      >
                        <FiDownload />
                        Tải xuống
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={deliverable.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FiEye />
                        Xem
                      </a>
                    </Button>
                  </HStack>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        );
      })}
    </Box>
  );
};

export default DeliverableUpload;
