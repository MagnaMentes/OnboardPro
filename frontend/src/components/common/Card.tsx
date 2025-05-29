import React, { ReactNode } from "react";
import {
  Box,
  BoxProps,
  useStyleConfig,
  Heading,
  Text,
  Flex,
  FlexProps,
  useColorModeValue,
} from "@chakra-ui/react";
import designTokens, {
  spacing,
  componentSizes,
  margins,
  positioning,
} from "../../theme/designTokens";

export interface CardProps extends BoxProps {
  variant?: "elevated" | "outline" | "filled" | "unstyled";
  colorScheme?: string;
  size?: "sm" | "md" | "lg";
}

export interface CardHeaderProps extends FlexProps {
  children: ReactNode;
}

export interface CardBodyProps extends BoxProps {
  children: ReactNode;
}

export interface CardFooterProps extends FlexProps {
  children: ReactNode;
}

/**
 * Компонент карточки OnboardPro согласно дизайн-системе.
 *
 * @example
 * <Card variant="elevated" size="md">
 *   <CardHeader>
 *     <Heading size="md">Заголовок карточки</Heading>
 *   </CardHeader>
 *   <CardBody>
 *     <Text>Содержимое карточки</Text>
 *   </CardBody>
 *   <CardFooter>
 *     <Button>Кнопка</Button>
 *   </CardFooter>
 * </Card>
 */
export const Card: React.FC<CardProps> = (props) => {
  const {
    variant = "outline",
    colorScheme,
    size = "md",
    children,
    ...rest
  } = props;
  const styles = useStyleConfig("Card.container", { variant, colorScheme });
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.800");

  // Определяем размеры карточки на основе size
  const paddingSize =
    size === "sm" ? spacing.md : size === "lg" ? spacing.xl : spacing.lg;
  const borderRadius = size === "sm" ? "md" : "lg";
  const boxShadow = variant === "elevated" ? "md" : undefined;

  return (
    <Box
      __css={styles}
      p={paddingSize}
      borderWidth={variant === "outline" ? "1px" : 0}
      borderColor={borderColor}
      borderRadius={borderRadius}
      bg={bgColor}
      boxShadow={boxShadow}
      {...rest}
    >
      {children}
    </Box>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = (props) => {
  const { children, ...rest } = props;
  const styles = useStyleConfig("Card.header");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Flex
      __css={styles}
      pb={spacing.md}
      mb={spacing.md}
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      {...positioning.spaceBetween}
      {...rest}
    >
      {children}
    </Flex>
  );
};

export const CardBody: React.FC<CardBodyProps> = (props) => {
  const { children, ...rest } = props;
  const styles = useStyleConfig("Card.body");

  return (
    <Box __css={styles} py={spacing.sm} {...rest}>
      {children}
    </Box>
  );
};

export const CardFooter: React.FC<CardFooterProps> = (props) => {
  const { children, ...rest } = props;
  const styles = useStyleConfig("Card.footer");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Flex
      __css={styles}
      pt={spacing.md}
      mt={spacing.md}
      borderTopWidth="1px"
      borderTopColor={borderColor}
      {...positioning.flexEnd}
      {...rest}
    >
      {children}
    </Flex>
  );
};
