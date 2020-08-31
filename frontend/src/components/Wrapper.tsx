import React from 'react'
import { Box } from '@chakra-ui/core'

export type WrapperVariant = 'small' | 'regular'

interface WrapperProps {
  variant?: WrapperVariant
}

export const Wrapper: React.FC<WrapperProps> = ({
  children,
  variant = 'regular'
}) => (
  <Box
    maxW={variant === 'regular' ? '800px' : '400px'}
    p={8}
    mt={8}
    w='100%'
    mx='auto'
  >
    {children}
  </Box>
)

export default Wrapper
