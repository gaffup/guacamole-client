/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.apache.guacamole.auth.ldap.conf;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.google.inject.Inject;
import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.GuacamoleServerException;
import org.apache.guacamole.environment.Environment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service for retrieving configuration information regarding LDAP servers.
 */
public class ConfigurationService {

    /**
     * Logger for this class.
     */
    private static final Logger logger = LoggerFactory.getLogger(ConfigurationService.class);
    
    /**
     * ObjectMapper for deserializing YAML.
     */
    private final ObjectMapper mapper = new ObjectMapper(new YAMLFactory());

    /**
     * The name of the file within GUACAMOLE_HOME that defines each available
     * LDAP server (if not using guacamole.properties).
     */
    private static final String LDAP_SERVERS_YML = "ldap-servers.yml";
    
    /**
     * The Guacamole server environment.
     */
    @Inject
    private Environment environment;

    /**
     * Returns the configuration information for all configured LDAP servers.
     * If multiple servers are returned, each should be tried in order until a
     * successful LDAP connection is established.
     *
     * @return
     *     The configurations of all LDAP servers.
     *
     * @throws GuacamoleException
     *     If the configuration information of the LDAP servers cannot be
     *     retrieved due to an error.
     */
    public Collection<? extends LDAPConfiguration> getLDAPConfigurations() throws GuacamoleException {

        // Read configuration from YAML, if available
        File ldapServers = new File(environment.getGuacamoleHome(), LDAP_SERVERS_YML);
        if (ldapServers.exists()) {
            try {
                logger.debug("Reading LDAP configuration from \"{}\"...", ldapServers);
                return mapper.readValue(ldapServers, new TypeReference<Collection<JacksonLDAPConfiguration>>() {});
            }
            catch (IOException e) {
                logger.error("\"{}\" could not be read/parsed: {}", ldapServers, e.getMessage());
                throw new GuacamoleServerException("Cannot read LDAP configuration from \"" + ldapServers + "\"", e);
            }
        }

        // Use guacamole.properties if not using YAML
        logger.debug("Reading LDAP configuration from guacamole.properties...");
        return Collections.singletonList(new EnvironmentLDAPConfiguration(environment));

    }

}
