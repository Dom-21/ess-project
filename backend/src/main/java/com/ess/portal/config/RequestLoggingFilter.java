package com.ess.portal.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // No-op
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpServletRequest) {
            String method = httpServletRequest.getMethod();
            String uri = httpServletRequest.getRequestURI();
            String queryString = httpServletRequest.getQueryString();
            String clientIp = httpServletRequest.getRemoteAddr();

            if (queryString != null) {
                logger.info("[HTTP REQUEST] Incoming: {} {}?{} from IP: {}", method, uri, queryString, clientIp);
            } else {
                logger.info("[HTTP REQUEST] Incoming: {} {} from IP: {}", method, uri, clientIp);
            }

            long startTime = System.currentTimeMillis();
            try {
                chain.doFilter(request, response);
            } finally {
                long duration = System.currentTimeMillis() - startTime;
                logger.info("[HTTP RESPONSE] Completed: {} {} in {}ms", method, uri, duration);
            }
        } else {
            chain.doFilter(request, response);
        }
    }

    @Override
    public void destroy() {
        // No-op
    }
}
