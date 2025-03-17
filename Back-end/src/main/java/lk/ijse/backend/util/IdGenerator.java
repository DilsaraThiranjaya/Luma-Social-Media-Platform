package lk.ijse.backend.util;


import lk.ijse.backend.annotation.CustomGenerator;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;

import java.lang.reflect.Field;
import java.util.EnumSet;
import java.util.UUID;

public class IdGenerator implements BeforeExecutionGenerator {

    @Override
    public EnumSet<EventType> getEventTypes() {
        return EnumSet.of(EventType.INSERT);
    }

    @Override
    public Object generate(SharedSessionContractImplementor session, Object owner, Object currentValue, EventType eventType) {
        Class<?> entityClass = owner.getClass();
        Field idField = null;

        for (Field field : entityClass.getDeclaredFields()) {
            if (field.isAnnotationPresent(CustomGenerator.class)) {
                idField = field;
                break;
            }
        }
        if (idField == null) {
            throw new IllegalStateException("No field found with CustomGenerator annotation");
        }

        CustomGenerator annotation = idField.getAnnotation(CustomGenerator.class);
        String prefix = annotation.prefix();
        return prefix + UUID.randomUUID().toString().substring(0, 6);
    }
}

