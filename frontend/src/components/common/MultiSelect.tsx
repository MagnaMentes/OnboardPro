import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
  Input,
  InputGroup,
  List,
  ListItem,
  Text,
  useOutsideClick,
  useColorModeValue,
} from "@chakra-ui/react";

interface Option {
  value: number;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Выберите...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const boxBgColor = useColorModeValue("white", "gray.800");
  const boxBorderColor = useColorModeValue("gray.200", "gray.600");
  const optionHoverBgColor = useColorModeValue("gray.100", "gray.700");
  const tagBgColor = useColorModeValue("blue.100", "blue.800");

  // Закрыть выпадающий список при клике вне компонента
  useOutsideClick({
    ref: containerRef,
    handler: () => setIsOpen(false),
  });

  // Фильтрация опций на основе ввода пользователя
  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedValues.includes(option.value)
  );

  // Выбранные опции
  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value)
  );

  const handleSelect = (value: number) => {
    onChange([...selectedValues, value]);
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemove = (value: number) => {
    onChange(selectedValues.filter((v) => v !== value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  return (
    <Box position="relative" ref={containerRef}>
      <Flex
        flexWrap="wrap"
        border="1px solid"
        borderColor={boxBorderColor}
        borderRadius="md"
        p={2}
        minHeight="40px"
        gap={2}
        onClick={handleInputClick}
        cursor="text"
      >
        {selectedOptions.map((option) => (
          <Tag
            key={option.value}
            size="md"
            borderRadius="md"
            variant="solid"
            bg={tagBgColor}
            color="gray.800"
          >
            <TagLabel>{option.label}</TagLabel>
            <TagCloseButton onClick={() => handleRemove(option.value)} />
          </Tag>
        ))}

        <InputGroup flex="1" minWidth="120px">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder={selectedOptions.length === 0 ? placeholder : ""}
            variant="unstyled"
            _focus={{ outline: "none" }}
          />
        </InputGroup>
      </Flex>

      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          maxH="200px"
          overflowY="auto"
          bg={boxBgColor}
          borderWidth="1px"
          borderColor={boxBorderColor}
          borderRadius="md"
          zIndex={10}
          mt={1}
          shadow="md"
        >
          {filteredOptions.length > 0 ? (
            <List spacing={0}>
              {filteredOptions.map((option) => (
                <ListItem
                  key={option.value}
                  p={2}
                  cursor="pointer"
                  _hover={{ bg: optionHoverBgColor }}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </ListItem>
              ))}
            </List>
          ) : (
            <Text p={2} color="gray.500" fontSize="sm">
              Нет доступных вариантов
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MultiSelect;
